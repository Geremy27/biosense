#!/usr/bin/env tsx
/**
 * TypeScript replacement for scripts/ingest-ifm-food-plans.py
 *
 * Builds app/knowledge/ifm/food-plans.bundle.json from
 * knowledge/ifm/manifest.json + PDFs — no Python required.
 *
 * Usage:
 *   tsx scripts/ingest-ifm-food-plans.ts           # full ingest
 *   tsx scripts/ingest-ifm-food-plans.ts --ensure  # no-op if up-to-date or PDFs absent
 *   tsx scripts/ingest-ifm-food-plans.ts --check   # exit 1 if stale
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// pdf-parse is CommonJS-only; import via require so ESM projects work
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const IFM_ROOT = join(REPO_ROOT, 'knowledge', 'ifm');
const MANIFEST_PATH = join(IFM_ROOT, 'manifest.json');
const DEFAULT_PDF_DIR = join(IFM_ROOT, 'pdfs');
const OUT_PATH = join(REPO_ROOT, 'app', 'knowledge', 'ifm', 'food-plans.bundle.json');

// ---------------------------------------------------------------------------
// Manifest types
// ---------------------------------------------------------------------------
interface Manifest {
  meta: {
    features: { file: string };
    macronutrients: { file: string };
    phytonutrient: { file: string };
  };
  plans: Record<
    string,
    {
      displayName: string;
      supportsCalorieTiers: boolean;
      mapsToDietType?: string;
      files: Record<string, string>;
    }
  >;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) fail(`Missing manifest: ${MANIFEST_PATH}`);
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
}

function referencedPdfFiles(manifest: Manifest): string[] {
  const files = new Set<string>();
  files.add(manifest.meta.features.file);
  files.add(manifest.meta.macronutrients.file);
  files.add(manifest.meta.phytonutrient.file);
  for (const plan of Object.values(manifest.plans)) {
    for (const f of Object.values(plan.files)) files.add(f);
  }
  return [...files].sort();
}

function computeSourceFingerprint(manifest: Manifest, pdfDir: string): string {
  const hash = createHash('sha256');
  hash.update(readFileSync(MANIFEST_PATH));
  for (const relative of referencedPdfFiles(manifest)) {
    const path = join(pdfDir, relative);
    if (!existsSync(path)) throw new Error(`Missing PDF: ${path}`);
    hash.update(relative + '\0');
    hash.update(readFileSync(path));
  }
  return hash.digest('hex');
}

function sourcesAvailable(manifest: Manifest, pdfDir: string): boolean {
  if (!existsSync(pdfDir) || !statSync(pdfDir).isDirectory()) return false;
  try {
    computeSourceFingerprint(manifest, pdfDir);
    return true;
  } catch {
    return false;
  }
}

async function extractPdf(path: string): Promise<string> {
  const buffer = readFileSync(path);
  const data = await pdfParse(buffer);
  return data.text.trim();
}

function readBundleFingerprint(): string | null {
  if (!existsSync(OUT_PATH)) return null;
  try {
    const bundle = JSON.parse(readFileSync(OUT_PATH, 'utf8')) as Record<string, unknown>;
    return typeof bundle.sourceFingerprint === 'string' ? bundle.sourceFingerprint : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------
async function ingest(manifest: Manifest, pdfDir: string): Promise<void> {
  async function pdf(relative: string): Promise<string> {
    const path = join(pdfDir, relative);
    if (!existsSync(path)) fail(`Missing PDF: ${path}`);
    return extractPdf(path);
  }

  const plansOut: Record<string, unknown> = {};
  for (const [planKey, plan] of Object.entries(manifest.plans)) {
    const documents: Record<string, string> = {};
    for (const [docKey, filename] of Object.entries(plan.files)) {
      documents[docKey] = await pdf(filename);
    }
    plansOut[planKey] = {
      key: planKey,
      displayName: plan.displayName,
      supportsCalorieTiers: plan.supportsCalorieTiers,
      mapsToDietType: plan.mapsToDietType ?? plan.displayName,
      documents,
    };
  }

  const fingerprint = computeSourceFingerprint(manifest, pdfDir);
  const bundle = {
    version: 1,
    sourceFingerprint: fingerprint,
    generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    featuresText: await pdf(manifest.meta.features.file),
    macronutrientsText: await pdf(manifest.meta.macronutrients.file),
    phytonutrientText: await pdf(manifest.meta.phytonutrient.file),
    plans: plansOut,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(bundle, null, 2) + '\n', 'utf8');
  const kb = Math.floor(statSync(OUT_PATH).size / 1024);
  console.log(`Wrote ${OUT_PATH} (${kb} KB)`);
}

async function cmdEnsure(manifest: Manifest, pdfDir: string): Promise<void> {
  if (!sourcesAvailable(manifest, pdfDir)) {
    if (existsSync(OUT_PATH)) {
      console.log('IFM: using committed bundle (source PDFs not present locally).');
      return;
    }
    fail(`IFM bundle missing and PDFs not available under ${pdfDir}`);
  }

  const current = computeSourceFingerprint(manifest, pdfDir);
  const existing = readBundleFingerprint();
  if (existing === current) {
    console.log('IFM: bundle already matches source PDFs.');
    return;
  }

  console.log('IFM: source changed — regenerating bundle…');
  await ingest(manifest, pdfDir);
}

function cmdCheck(manifest: Manifest, pdfDir: string): void {
  if (!existsSync(OUT_PATH)) fail(`Missing bundle: ${OUT_PATH}`);

  const bundle = JSON.parse(readFileSync(OUT_PATH, 'utf8')) as Record<string, unknown>;
  if (!bundle.plans || typeof bundle.plans !== 'object') {
    fail('IFM bundle is missing plans.');
  }

  if (!sourcesAvailable(manifest, pdfDir)) {
    console.log('IFM: bundle present (CI / deploy mode, PDFs not checked).');
    return;
  }

  const current = computeSourceFingerprint(manifest, pdfDir);
  const existing = readBundleFingerprint();
  if (existing !== current) {
    fail('IFM bundle is stale. Run: npm run ingest:ifm');
  }
  console.log('IFM: bundle matches source PDFs.');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const ensure = args.includes('--ensure');
const check = args.includes('--check');

const manifest = loadManifest();
const pdfDir = resolve(process.env['IFM_PDF_DIR'] ?? DEFAULT_PDF_DIR);

if (check) {
  cmdCheck(manifest, pdfDir);
} else if (ensure) {
  await cmdEnsure(manifest, pdfDir);
} else {
  if (!existsSync(pdfDir) || !statSync(pdfDir).isDirectory()) {
    fail(`PDF directory not found: ${pdfDir}`);
  }
  await ingest(manifest, pdfDir);
}
