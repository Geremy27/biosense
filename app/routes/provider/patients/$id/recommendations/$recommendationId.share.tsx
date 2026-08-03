import { Download, Loader2, Printer } from 'lucide-react';
import { useRef, useState } from 'react';
import { Form, Link, useOutletContext, useSubmit } from 'react-router';

import { APP_NAME } from '~/brand';
import { RecommendationOutputView } from '~/components/recommendations/recommendation-output-view';
import {
  getClinicalRecommendation,
  parseShareSectionsSelection,
  updateClinicalRecommendationShareSectionsById,
} from '~/services/clinical-recommendations.service';
import { buildActorContext } from '~/utils/session.server';
import { asRecommendationOutput, shareableSectionValues } from '~/validation/recommendations';
import type { ShareableSection } from '~/validation/recommendations';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/$recommendationId.share';

const SECTION_LABELS: Record<ShareableSection, string> = {
  context: 'Contexto clínico (edad y sexo)',
  executiveSummary: 'Resumen ejecutivo',
  conclusions: 'Conclusiones',
  recommendations: 'Recomendaciones',
  lifestyle: 'Sugerencias de estilo de vida',
  supplements: 'Posibles suplementos',
};

const DEFAULT_SECTIONS: ShareableSection[] = [
  'context',
  'conclusions',
  'recommendations',
  'lifestyle',
  'supplements',
];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const recommendation = await getClinicalRecommendation(
    ctx,
    params.id,
    params.recommendationId,
  );

  if (!recommendation) {
    throw new Response('No encontrado', { status: 404 });
  }

  return { recommendation };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const ctx = await buildActorContext(request);
  const sections = parseShareSectionsSelection(formData);

  await updateClinicalRecommendationShareSectionsById(
    ctx,
    params.id,
    params.recommendationId,
    sections,
  );

  return { ok: true };
}

export default function RecommendationShare({ loaderData }: Route.ComponentProps) {
  const { patient } = useOutletContext<PatientOutletContext>();
  const { recommendation } = loaderData;
  const output = asRecommendationOutput(recommendation.output);
  const savedSections = Array.isArray(recommendation.shareSections)
    ? (recommendation.shareSections as ShareableSection[])
    : DEFAULT_SECTIONS;
  const [selected, setSelected] = useState<ShareableSection[]>(savedSections);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const submit = useSubmit();
  const printableRef = useRef<HTMLDivElement>(null);

  if (!output) {
    return (
      <div className="card">
        <p className="text-sm text-slate-500">
          Esta recomendación todavía no tiene contenido para compartir.
        </p>
      </div>
    );
  }

  async function handleSavePdf() {
    const container = printableRef.current;
    if (!container || isSavingPdf) {
      return;
    }

    setIsSavingPdf(true);
    // Forces the lifestyle grid into a single column for the capture only,
    // so three cards don't get squeezed side-by-side into a narrow PDF page.
    container.classList.add('pdf-export');
    try {
      // html2canvas-pro (not the stock html2canvas) is required because
      // Tailwind v4's default palette uses oklch(), which the original
      // html2canvas library cannot parse and throws on.
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);

      const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
      const margin = 14;
      const footerReserve = 8;
      const gap = 5;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      const contentBottom = pageHeight - margin - footerReserve;
      const maxHeightPerPage = contentBottom - margin;

      // Each [data-pdf-block] (a whole "card" section) is captured and placed
      // as one unit so a card never gets sliced in half across a page break;
      // if a card doesn't fit in the space left on the page, it starts fresh
      // on the next one instead.
      const blocks = Array.from(container.querySelectorAll<HTMLElement>('[data-pdf-block]'));
      const targets = blocks.length > 0 ? blocks : [container];

      let cursorY = margin;

      for (const block of targets) {
        const canvas = await html2canvas(block, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        const availableHeight = contentBottom - cursorY;

        if (imgHeight <= availableHeight) {
          doc.addImage(imageData, 'JPEG', margin, cursorY, imgWidth, imgHeight);
          cursorY += imgHeight + gap;
          continue;
        }

        if (cursorY > margin) {
          doc.addPage();
          cursorY = margin;
        }

        if (imgHeight <= maxHeightPerPage) {
          doc.addImage(imageData, 'JPEG', margin, margin, imgWidth, imgHeight);
          cursorY = margin + imgHeight + gap;
          continue;
        }

        // Rare case: a single card is taller than a full page. Slice it
        // across as many pages as needed, then force the next card to
        // start on a clean page rather than packing it under a partial slice.
        let rendered = 0;
        let isFirstSlice = true;
        while (rendered < imgHeight) {
          if (!isFirstSlice) {
            doc.addPage();
          }
          doc.addImage(imageData, 'JPEG', margin, margin - rendered, imgWidth, imgHeight);
          rendered += maxHeightPerPage;
          isFirstSlice = false;
        }
        cursorY = contentBottom + 1;
      }

      const totalPages = doc.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`${APP_NAME} · Página ${page} de ${totalPages}`, pageWidth / 2, pageHeight - 6, {
          align: 'center',
        });
      }

      const filename = `recomendacion-${slugify(
        `${patient.firstName} ${patient.firstLastName}`,
      )}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } finally {
      container.classList.remove('pdf-export');
      setIsSavingPdf(false);
    }
  }

  function toggleSection(section: ShareableSection) {
    setSelected((current) => {
      const next = current.includes(section)
        ? current.filter((value) => value !== section)
        : [...current, section];

      const formData = new FormData();
      next.forEach((value) => formData.append('sections', value));
      submit(formData, { method: 'post', replace: true });

      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link
          to={`/provider/patients/${patient.id}/recommendations/${recommendation.id}`}
          className="text-sm font-semibold text-cyan-600 hover:text-cyan-800"
        >
          ← Recomendación
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-cyan-950">Compartir con el paciente</h2>
        <p className="mt-2 text-sm text-slate-500">
          Elige qué secciones incluir, como cuando eliges páginas al imprimir. Hallazgos, métricas
          derivadas y el resumen ejecutivo nunca se comparten: son solo para el médico.
        </p>
      </div>

      <Form method="post" className="card space-y-4 print:hidden">
        <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-900">
          Secciones a incluir
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {shareableSectionValues
            .filter((section) => section !== 'executiveSummary')
            .map((section) => (
              <label key={section} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.includes(section)}
                  onChange={() => toggleSection(section)}
                />
                {SECTION_LABELS[section]}
              </label>
            ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary gap-2" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            Imprimir
          </button>
          <button
            type="button"
            className="btn-ghost gap-2 disabled:pointer-events-none disabled:opacity-60"
            onClick={handleSavePdf}
            disabled={isSavingPdf}
            aria-busy={isSavingPdf}
          >
            {isSavingPdf ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {isSavingPdf ? 'Generando PDF…' : 'Guardar PDF'}
          </button>
        </div>
      </Form>

      <div ref={printableRef} className="card space-y-6 print:border-0 print:shadow-none">
        <div data-pdf-block className="border-b border-slate-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">
            {APP_NAME}
          </p>
          <h3 className="mt-1 text-xl font-bold text-cyan-950">
            {patient.firstName} {patient.firstLastName}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Reporte generado el{' '}
            {new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date())}
          </p>
        </div>
        <RecommendationOutputView output={output} audience="patient" visibleSections={selected} />
      </div>
    </div>
  );
}
