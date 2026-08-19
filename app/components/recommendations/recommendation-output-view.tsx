import { Brain, Dumbbell, Utensils, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  formatFindingDomain,
  formatFindingSeverity,
  severityBadgeClass,
} from '~/utils/recommendation-display';
import type { RecommendationOutput, ShareableSection } from '~/validation/recommendations';

type RecommendationOutputViewProps = {
  output: RecommendationOutput;
  /** 'provider' (default) shows every clinical section. 'patient' hides
   * clinician-only internals (hallazgos, métricas derivadas, resumen
   * ejecutivo, consideración de medicación) regardless of visibleSections. */
  audience?: 'provider' | 'patient';
  /** When provided, restricts the shareable sections to this list (used by
   * the share/print screen). Omit to show every section for the audience. */
  visibleSections?: ShareableSection[];
  residenceRegionName?: string | null;
};

export function RecommendationOutputView({
  output,
  audience = 'provider',
  visibleSections,
  residenceRegionName,
}: RecommendationOutputViewProps) {
  const isProvider = audience === 'provider';
  const showSection = (section: ShareableSection) =>
    visibleSections ? visibleSections.includes(section) : true;
  // Rationale is the "why" aimed at the clinician; patients only get the
  // plain-language guidance/statement/action.
  const showRationale = isProvider;

  return (
    <div className="space-y-6">
      {isProvider && output.executiveSummary.length > 0 ? (
        <section data-pdf-block className="card border-cyan-200 bg-cyan-50">
          <h3 className="text-lg font-bold text-cyan-950">Resumen ejecutivo</h3>
          <p className="mt-1 text-xs text-cyan-800">
            Solo para el médico. No se incluye al compartir con el paciente.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-cyan-950">
            {output.executiveSummary.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {isProvider && showSection('context') ? (
        <section data-pdf-block className="card">
          <h3 className="text-lg font-bold text-cyan-950">Contexto clínico usado</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Edad
              </dt>
              <dd className="mt-1 text-sm font-semibold text-cyan-950">
                {output.patientContextEcho.ageYears} años
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sexo
              </dt>
              <dd className="mt-1 text-sm font-semibold text-cyan-950">
                {output.patientContextEcho.sex || 'No indicado'}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {isProvider ? (
        <section data-pdf-block className="space-y-4">
          <h3 className="text-lg font-bold text-cyan-950">Hallazgos</h3>
          {output.findings.length === 0 ? (
            <p className="text-sm text-slate-500">Sin hallazgos estructurados.</p>
          ) : (
            output.findings.map((finding, index) => (
              <article key={`${finding.title}-${index}`} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">
                      {formatFindingDomain(finding.domain)}
                    </p>
                    <h4 className="mt-1 font-bold text-cyan-950">
                      {finding.title}
                      {finding.uncertain ? ' *' : ''}
                    </h4>
                  </div>
                  <span className={`badge-pill ${severityBadgeClass(finding.severity)}`}>
                    {formatFindingSeverity(finding.severity)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {finding.interpretation}
                </p>
              </article>
            ))
          )}
        </section>
      ) : null}

      {isProvider && output.derivedMetrics.length > 0 ? (
        <section data-pdf-block className="card overflow-x-auto p-0">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-lg font-bold text-cyan-950">Métricas derivadas</h3>
          </div>
          <table className="data-table">
            <thead className="data-table-head">
              <tr>
                <th className="data-table-th">Métrica</th>
                <th className="data-table-th">Valor</th>
                <th className="data-table-th">Unidad</th>
                <th className="data-table-th">Nota</th>
              </tr>
            </thead>
            <tbody>
              {output.derivedMetrics.map((metric, index) => (
                <tr key={`${metric.name}-${index}`} className="data-table-row">
                  <td className="data-table-td font-semibold text-cyan-950">
                    {metric.name}
                    {metric.uncertain ? ' *' : ''}
                  </td>
                  <td className="data-table-td">{metric.value || '—'}</td>
                  <td className="data-table-td">{metric.unit || '—'}</td>
                  <td className="data-table-td">{metric.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {isProvider ? (
        <section data-pdf-block className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm leading-relaxed text-slate-600">
            {output.medicationConsiderationNote}
          </p>
        </section>
      ) : null}

      {showSection('conclusions') ? (
        <section data-pdf-block className="card space-y-4">
          <h3 className="text-lg font-bold text-cyan-950">Conclusiones</h3>
          <ol className="mt-2 list-decimal space-y-4 pl-5">
            {output.conclusions.map((item, index) => (
              <li key={index} className="text-sm leading-relaxed text-slate-700">
                <p className="font-semibold text-cyan-950">{item.statement}</p>
                {showRationale && item.rationale ? (
                  <p className="mt-1 text-slate-600">
                    <span className="font-medium text-cyan-900">Por qué: </span>
                    {item.rationale}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {showSection('recommendations') ? (
        <section data-pdf-block className="card space-y-4">
          <h3 className="text-lg font-bold text-cyan-950">Recomendaciones</h3>
          <ul className="mt-2 list-disc space-y-4 pl-5">
            {output.recommendations.map((item, index) => (
              <li key={index} className="text-sm leading-relaxed text-slate-700">
                <p className="font-semibold text-cyan-950">{item.action}</p>
                {showRationale && item.rationale ? (
                  <p className="mt-1 text-slate-600">
                    <span className="font-medium text-cyan-900">Por qué: </span>
                    {item.rationale}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showSection('lifestyle') ? (
        <section data-pdf-block className="space-y-4">
          <h3 className="text-lg font-bold text-cyan-950">Sugerencias de estilo de vida</h3>
          <div className="space-y-4">
            <LifestyleSection
              title="Nutrición"
              icon={Utensils}
              keyNumbers={output.lifestyle.nutrition.keyNumbers}
              patientSummary={output.lifestyle.nutrition.patientSummary}
              guidance={output.lifestyle.nutrition.guidance}
              rationale={showRationale ? output.lifestyle.nutrition.rationale : ''}
              meta={
                <>
                  {output.lifestyle.nutrition.dietType ? (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-cyan-900">Tipo de dieta: </span>
                      {output.lifestyle.nutrition.dietType}
                    </p>
                  ) : null}
                  {residenceRegionName ? (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-cyan-900">Ciudad / región: </span>
                      {residenceRegionName}
                    </p>
                  ) : null}
                </>
              }
            >
              <div data-pdf-lifestyle-subgrid className="grid gap-4 md:grid-cols-2">
                <NutritionSubsection title="Macros" block={output.lifestyle.nutrition.macros} />
                <NutritionSubsection title="Micros" block={output.lifestyle.nutrition.micros} />
              </div>
            </LifestyleSection>

            <LifestyleSection
              title="Ejercicio"
              icon={Dumbbell}
              keyNumbers={output.lifestyle.exercise.keyNumbers}
              patientSummary={output.lifestyle.exercise.patientSummary}
              guidance={output.lifestyle.exercise.guidance}
              rationale={showRationale ? output.lifestyle.exercise.rationale : ''}
            >
              <div data-pdf-lifestyle-subgrid className="grid gap-4 md:grid-cols-3">
                <LabeledSubsection title="Tipo" body={output.lifestyle.exercise.type} />
                <LabeledSubsection title="Duración" body={output.lifestyle.exercise.duration} />
                <LabeledSubsection
                  title="Intensidad"
                  body={output.lifestyle.exercise.intensity}
                  extra={
                    output.lifestyle.exercise.intensityExplanation
                      ? {
                          label: 'Qué significa',
                          body: output.lifestyle.exercise.intensityExplanation,
                        }
                      : null
                  }
                />
              </div>
            </LifestyleSection>

            <LifestyleSection
              title="Mental y sueño"
              icon={Brain}
              keyNumbers={output.lifestyle.mentalAndSleep.keyNumbers}
              patientSummary={output.lifestyle.mentalAndSleep.patientSummary}
              guidance={output.lifestyle.mentalAndSleep.guidance}
              rationale={showRationale ? output.lifestyle.mentalAndSleep.rationale : ''}
            >
              {output.lifestyle.mentalAndSleep.practices.length > 0 ? (
                <div
                  data-pdf-lifestyle-subgrid
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  {output.lifestyle.mentalAndSleep.practices.map((practice, index) => (
                    <LabeledSubsection
                      key={index}
                      title={practice.what || `Práctica ${index + 1}`}
                      extra={
                        practice.howToKnow
                          ? { label: 'Cómo saber que va bien', body: practice.howToKnow }
                          : null
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sin prácticas estructuradas.</p>
              )}
            </LifestyleSection>
          </div>
        </section>
      ) : null}

      {showSection('supplements') ? (
        <section data-pdf-block className="card space-y-4">
          <h3 className="text-lg font-bold text-cyan-950">Posibles suplementos</h3>
          {output.possibleSupplements.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sin suplementos sugeridos con la información actual.
            </p>
          ) : (
            output.possibleSupplements.map((supplement, index) => (
              <article
                key={`${supplement.name}-${index}`}
                className="rounded-lg border border-slate-200 p-4"
              >
                <h4 className="font-semibold text-cyan-950">
                  {index + 1}. {supplement.name}
                  {supplement.requiresMoreLabs ? ' *' : ''}
                </h4>
                {supplement.dose ? (
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    Dosis: {supplement.dose}
                  </p>
                ) : null}
                {showRationale ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    <span className="font-medium text-cyan-900">Por qué: </span>
                    {supplement.rationale}
                  </p>
                ) : null}
                {isProvider && supplement.requiresMoreLabs ? (
                  <p className="mt-2 text-sm text-amber-800">
                    Falta información de laboratorio
                    {supplement.missingLabs ? `: ${supplement.missingLabs}` : '.'} Evalúalo con el
                    médico tratante.
                  </p>
                ) : null}
              </article>
            ))
          )}
        </section>
      ) : null}

      {isProvider && output.missingInformation.length > 0 ? (
        <section data-pdf-block className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-950">Información faltante *</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {output.missingInformation.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function LifestyleSection({
  title,
  icon: Icon,
  keyNumbers,
  patientSummary,
  guidance,
  rationale,
  meta,
  children,
}: {
  title: string;
  icon: LucideIcon;
  keyNumbers: Array<{ label: string; value: string }>;
  patientSummary: string;
  guidance: string;
  rationale: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="card space-y-4">
      <header className="flex items-start gap-3">
        <div className="icon-container shrink-0">
          <Icon className="size-5 text-cyan-600" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h4 className="text-lg font-bold text-cyan-950">{title}</h4>
          {meta}
          {keyNumbers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keyNumbers.map((keyNumber, index) => (
                <span
                  key={index}
                  className="rounded-lg bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-900"
                >
                  {keyNumber.label}: {keyNumber.value}
                </span>
              ))}
            </div>
          ) : null}
          {patientSummary ? (
            <p className="text-sm leading-relaxed text-slate-700">{patientSummary}</p>
          ) : null}
        </div>
      </header>

      {children}

      {guidance ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{guidance}</p>
      ) : null}
      {rationale ? (
        <p className="text-sm leading-relaxed text-slate-600">
          <span className="font-medium text-cyan-900">Por qué (para el médico): </span>
          {rationale}
        </p>
      ) : null}
    </article>
  );
}

function NutritionSubsection({
  title,
  block,
}: {
  title: string;
  block: RecommendationOutput['lifestyle']['nutrition']['macros'];
}) {
  return (
    <div className="rounded-lg border border-cyan-100 bg-cyan-50/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-900">{title}</p>
      {block.targets ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{block.targets}</p>
      ) : null}
      {block.sources.length > 0 ? (
        <ul className="mt-3 space-y-3 text-sm text-slate-700">
          {block.sources.map((source, index) => (
            <li key={index}>
              <p className="font-semibold text-cyan-950">
                {source.nutrient}
                {source.amount ? ` — ${source.amount}` : ''}
              </p>
              {source.foods.length > 0 ? (
                <p className="mt-1">
                  <span className="font-medium text-cyan-900">Obtener de: </span>
                  {source.foods.join(', ')}
                </p>
              ) : null}
              {source.localProducts.length > 0 ? (
                <p className="mt-1">
                  <span className="font-medium text-cyan-900">En tu ciudad: </span>
                  {source.localProducts.join(', ')}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Sin detalle estructurado.</p>
      )}
    </div>
  );
}

function LabeledSubsection({
  title,
  body,
  extra,
}: {
  title: string;
  body?: string;
  extra?: { label: string; body: string } | null;
}) {
  return (
    <div className="rounded-lg border border-cyan-100 bg-cyan-50/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-900">{title}</p>
      {body ? <p className="mt-2 text-sm leading-relaxed text-slate-700">{body}</p> : null}
      {!body && !extra ? (
        <p className="mt-2 text-sm text-slate-500">Sin detalle estructurado.</p>
      ) : null}
      {extra ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          <span className="font-medium text-cyan-900">{extra.label}: </span>
          {extra.body}
        </p>
      ) : null}
    </div>
  );
}
