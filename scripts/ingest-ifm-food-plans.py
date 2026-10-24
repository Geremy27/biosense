#!/usr/bin/env python3
"""Build app/knowledge/ifm/food-plans.bundle.json from knowledge/ifm/manifest.json + PDFs."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None  # type: ignore[misc, assignment]

REPO_ROOT = Path(__file__).resolve().parents[1]
IFM_ROOT = REPO_ROOT / "knowledge" / "ifm"
MANIFEST_PATH = IFM_ROOT / "manifest.json"
DEFAULT_PDF_DIR = IFM_ROOT / "pdfs"
OUT_PATH = REPO_ROOT / "app" / "knowledge" / "ifm" / "food-plans.bundle.json"


def load_manifest() -> dict:
    if not MANIFEST_PATH.is_file():
        print(f"Missing manifest: {MANIFEST_PATH}", file=sys.stderr)
        sys.exit(1)
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def referenced_pdf_files(manifest: dict) -> list[str]:
    files: list[str] = []
    for entry in manifest["meta"].values():
        files.append(entry["file"])
    for plan in manifest["plans"].values():
        files.extend(plan["files"].values())
    # Stable order for fingerprinting
    return sorted(set(files))


def compute_source_fingerprint(manifest: dict, pdf_dir: Path) -> str:
    digest = hashlib.sha256()
    digest.update(MANIFEST_PATH.read_bytes())
    for relative in referenced_pdf_files(manifest):
        path = pdf_dir / relative
        if not path.is_file():
            raise FileNotFoundError(path)
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
    return digest.hexdigest()


def sources_available(manifest: dict, pdf_dir: Path) -> bool:
    if not pdf_dir.is_dir():
        return False
    try:
        compute_source_fingerprint(manifest, pdf_dir)
    except FileNotFoundError:
        return False
    return True


def extract_pdf(path: Path) -> str:
    if PdfReader is None:
        print("Install pypdf: pip3 install pypdf", file=sys.stderr)
        sys.exit(1)
    reader = PdfReader(str(path))
    parts: list[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n".join(parts).strip()


def read_bundle_fingerprint() -> str | None:
    if not OUT_PATH.is_file():
        return None
    try:
        bundle = json.loads(OUT_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    value = bundle.get("sourceFingerprint")
    return value if isinstance(value, str) else None


def ingest(manifest: dict, pdf_dir: Path) -> None:
    def pdf(relative_file: str) -> str:
        path = pdf_dir / relative_file
        if not path.is_file():
            print(f"Missing PDF: {path}", file=sys.stderr)
            sys.exit(1)
        return extract_pdf(path)

    meta = manifest["meta"]
    plans_out: dict[str, object] = {}

    for plan_key, plan in manifest["plans"].items():
        documents: dict[str, str] = {}
        for doc_key, filename in plan["files"].items():
            documents[doc_key] = pdf(filename)
        plans_out[plan_key] = {
            "key": plan_key,
            "displayName": plan["displayName"],
            "supportsCalorieTiers": plan["supportsCalorieTiers"],
            "mapsToDietType": plan.get("mapsToDietType", plan["displayName"]),
            "documents": documents,
        }

    fingerprint = compute_source_fingerprint(manifest, pdf_dir)
    bundle = {
        "version": 1,
        "sourceFingerprint": fingerprint,
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
        .replace(microsecond=0)
        .isoformat(),
        "featuresText": pdf(meta["features"]["file"]),
        "macronutrientsText": pdf(meta["macronutrients"]["file"]),
        "phytonutrientText": pdf(meta["phytonutrient"]["file"]),
        "plans": plans_out,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(bundle, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({OUT_PATH.stat().st_size // 1024} KB)")


def cmd_ensure(manifest: dict, pdf_dir: Path) -> None:
    if not sources_available(manifest, pdf_dir):
        if OUT_PATH.is_file():
            print("IFM: using committed bundle (source PDFs not present locally).")
            return
        print(f"IFM bundle missing and PDFs not available under {pdf_dir}", file=sys.stderr)
        sys.exit(1)

    current = compute_source_fingerprint(manifest, pdf_dir)
    existing = read_bundle_fingerprint()
    if existing == current:
        print("IFM: bundle already matches source PDFs.")
        return

    print("IFM: source changed — regenerating bundle…")
    ingest(manifest, pdf_dir)


def cmd_check(manifest: dict, pdf_dir: Path) -> None:
    if not OUT_PATH.is_file():
        print(f"Missing bundle: {OUT_PATH}", file=sys.stderr)
        sys.exit(1)

    bundle = json.loads(OUT_PATH.read_text(encoding="utf-8"))
    if not isinstance(bundle.get("plans"), dict) or not bundle["plans"]:
        print("IFM bundle is missing plans.", file=sys.stderr)
        sys.exit(1)

    if not sources_available(manifest, pdf_dir):
        print("IFM: bundle present (CI / deploy mode, PDFs not checked).")
        return

    current = compute_source_fingerprint(manifest, pdf_dir)
    existing = read_bundle_fingerprint()
    if existing != current:
        print(
            "IFM bundle is stale. Run: npm run ingest:ifm",
            file=sys.stderr,
        )
        sys.exit(1)
    print("IFM: bundle matches source PDFs.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--ensure",
        action="store_true",
        help="Regenerate bundle when manifest/PDFs changed; no-op when PDFs absent.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 if local PDFs exist but bundle fingerprint differs.",
    )
    args = parser.parse_args()

    manifest = load_manifest()
    pdf_dir = Path(os.environ.get("IFM_PDF_DIR", DEFAULT_PDF_DIR)).resolve()

    if args.check:
        cmd_check(manifest, pdf_dir)
        return
    if args.ensure:
        cmd_ensure(manifest, pdf_dir)
        return

    if not pdf_dir.is_dir():
        print(f"PDF directory not found: {pdf_dir}", file=sys.stderr)
        sys.exit(1)
    ingest(manifest, pdf_dir)


if __name__ == "__main__":
    main()
