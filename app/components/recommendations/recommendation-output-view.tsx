import {
  formatFindingDomain,
  formatFindingSeverity,
  severityBadgeClass,
} from '~/utils/recommendation-display';
import type { RecommendationOutput } from '~/validation/recommendations';

type RecommendationOutputViewProps = {
  output: RecommendationOutput;
};

function LifestyleSection({
  title,
  item,
}: {
  title: string;
  item: RecommendationOutput['lifestyle']['nutrition'];
}) {
  return (
    <div>
      <h4 className="font-semibold text-cyan-900">{title}</h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {item.guidance}
      </p>
      {item.rationale ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          <span className="font-medium text-cyan-900">Por qué: </span>
          {item.rationale}
        </p>
      ) : null}
    </div>
  );
}

export function RecommendationOutputView({ output }: RecommendationOutputViewProps) {
  return (
    <div className="space-y-6">
      <section className="card">
        <h3 className="text-lg font-bold text-cyan-950">Contexto clínico usado</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Edad</dt>
            <dd className="mt-1 text-sm font-semibold text-cyan-950">
              {output.patientContextEcho.ageYears} años
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sexo</dt>
            <dd className="mt-1 text-sm font-semibold text-cyan-950">
              {output.patientContextEcho.sex || 'No indicado'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4">
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
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{finding.interpretation}</p>
            </article>
          ))
        )}
      </section>

      {output.derivedMetrics.length > 0 ? (
        <section className="card overflow-x-auto p-0">
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

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm leading-relaxed text-slate-600">
          {output.medicationConsiderationNote}
        </p>
      </section>

      <section className="card space-y-4">
        <h3 className="text-lg font-bold text-cyan-950">Conclusiones</h3>
        <ol className="mt-2 list-decimal space-y-4 pl-5">
          {output.conclusions.map((item, index) => (
            <li key={index} className="text-sm leading-relaxed text-slate-700">
              <p className="font-semibold text-cyan-950">{item.statement}</p>
              {item.rationale ? (
                <p className="mt-1 text-slate-600">
                  <span className="font-medium text-cyan-900">Por qué: </span>
                  {item.rationale}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="card space-y-4">
        <h3 className="text-lg font-bold text-cyan-950">Recomendaciones</h3>
        <ul className="mt-2 list-disc space-y-4 pl-5">
          {output.recommendations.map((item, index) => (
            <li key={index} className="text-sm leading-relaxed text-slate-700">
              <p className="font-semibold text-cyan-950">{item.action}</p>
              {item.rationale ? (
                <p className="mt-1 text-slate-600">
                  <span className="font-medium text-cyan-900">Por qué: </span>
                  {item.rationale}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-4">
        <h3 className="text-lg font-bold text-cyan-950">Sugerencias de estilo de vida</h3>
        <LifestyleSection title="1. Nutricional" item={output.lifestyle.nutrition} />
        <LifestyleSection title="2. Ejercicio" item={output.lifestyle.exercise} />
        <LifestyleSection title="3. Mental y sueño" item={output.lifestyle.mentalAndSleep} />
      </section>

      <section className="card space-y-4">
        <h3 className="text-lg font-bold text-cyan-950">Posibles suplementos</h3>
        {output.possibleSupplements.length === 0 ? (
          <p className="text-sm text-slate-500">Sin suplementos sugeridos con la información actual.</p>
        ) : (
          output.possibleSupplements.map((supplement, index) => (
            <article key={`${supplement.name}-${index}`} className="rounded-lg border border-slate-200 p-4">
              <h4 className="font-semibold text-cyan-950">
                {index + 1}. {supplement.name}
                {supplement.requiresMoreLabs ? ' *' : ''}
              </h4>
              {supplement.dose ? (
                <p className="mt-1 text-sm font-medium text-slate-700">Dosis: {supplement.dose}</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                <span className="font-medium text-cyan-900">Por qué: </span>
                {supplement.rationale}
              </p>
              {supplement.requiresMoreLabs ? (
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

      {output.missingInformation.length > 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
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
