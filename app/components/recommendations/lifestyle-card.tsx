import { ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type LifestyleBase = {
  guidance: string;
  rationale: string;
  patientSummary: string;
  keyNumbers: Array<{ label: string; value: string }>;
};

type LifestyleCardProps = {
  title: string;
  icon: LucideIcon;
  item: LifestyleBase;
  /** Extra structured content shown when expanded (macros/micros, intensity, etc.). */
  details?: ReactNode;
  /** 'patient' renders a static, always-expanded infographic-style card
   * without the clinician rationale, matching what gets printed. */
  audience: 'provider' | 'patient';
};

// Interactive square/card for a lifestyle suggestion. Providers see a
// collapsed summary they can click to expand; patients (share/print view)
// always see the full plain-language explanation, never the deep rationale.
export function LifestyleCard({ title, icon: Icon, item, details, audience }: LifestyleCardProps) {
  const isPatient = audience === 'patient';
  const [expanded, setExpanded] = useState(isPatient);

  return (
    <div className="overflow-hidden rounded-lg border border-cyan-100 bg-white">
      <button
        type="button"
        onClick={() => !isPatient && setExpanded((current) => !current)}
        className={`flex w-full items-start justify-between gap-3 p-4 text-left ${
          isPatient ? 'cursor-default' : 'hover:bg-cyan-50'
        }`}
        aria-expanded={expanded}
        disabled={isPatient}
      >
        <div className="flex items-start gap-3">
          <div className="icon-container shrink-0">
            <Icon className="size-5 text-cyan-600" aria-hidden />
          </div>
          <div>
            <h4 className="font-bold text-cyan-950">{title}</h4>
            {item.keyNumbers.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.keyNumbers.map((keyNumber, index) => (
                  <span
                    key={index}
                    className="rounded-lg bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-900"
                  >
                    {keyNumber.label}: {keyNumber.value}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        {!isPatient ? (
          expanded ? (
            <ChevronUp className="mt-1 size-4 shrink-0 text-cyan-600" aria-hidden />
          ) : (
            <ChevronDown className="mt-1 size-4 shrink-0 text-cyan-600" aria-hidden />
          )
        ) : null}
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-cyan-100 bg-cyan-50/40 p-4">
          {item.patientSummary ? (
            <p className="text-sm leading-relaxed text-slate-700">{item.patientSummary}</p>
          ) : null}
          {details}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {item.guidance}
          </p>
          {!isPatient && item.rationale ? (
            <p className="text-sm leading-relaxed text-slate-600">
              <span className="font-medium text-cyan-900">Por qué (para el médico): </span>
              {item.rationale}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
