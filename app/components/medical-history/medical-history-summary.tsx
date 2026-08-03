import type { MedicalHistoryInput } from '~/validation/medical-history';

type MedicalHistoryRecord = MedicalHistoryInput & {
  gynecoObstetricHistory: string | null;
};

type Item = {
  id: keyof MedicalHistoryRecord;
  label: string;
};

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Motivo de consulta',
    items: [{ id: 'chiefComplaint', label: 'Motivo de consulta' }],
  },
  {
    title: 'Antecedentes personales',
    items: [
      { id: 'personalHistory1', label: 'Personales 1 — Diagnósticos dados' },
      { id: 'personalHistory2', label: 'Personales 2 — Diagnósticos en estudio' },
      { id: 'surgicalHistory', label: 'Quirúrgicos' },
      { id: 'medications', label: 'Medicamentosos' },
      { id: 'supplements', label: 'Suplementos' },
      { id: 'infectiousHistory', label: 'Infecciosos (recurrentes)' },
      { id: 'traumaticHistory', label: 'Traumáticos' },
      { id: 'toxicologicalHistory', label: 'Toxicológicos' },
      { id: 'allergies', label: 'Alergias' },
      { id: 'vaccines', label: 'Vacunas *' },
      { id: 'habits', label: 'Hábitos' },
      { id: 'gynecoObstetricHistory', label: 'Ginecoobstétricos *' },
    ],
  },
  {
    title: 'Antecedentes familiares y psicosociales',
    items: [
      { id: 'familyHistory', label: 'Familiares' },
      { id: 'psychosocialHistory', label: 'Psicosociales *' },
    ],
  },
  {
    title: 'Notas',
    items: [{ id: 'notes', label: 'Notas adicionales' }],
  },
];

// Read-only view for a confirmed (legally locked) medical history record.
export function MedicalHistorySummary({ medicalHistory }: { medicalHistory: MedicalHistoryRecord }) {
  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => {
        const visibleItems = section.items.filter((item) => medicalHistory[item.id]);

        if (visibleItems.length === 0) {
          return null;
        }

        return (
          <section key={section.title} className="space-y-4 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-900">
              {section.title}
            </h3>
            <dl className="space-y-4">
              {visibleItems.map((item) => (
                <div key={item.id}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {medicalHistory[item.id]}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
