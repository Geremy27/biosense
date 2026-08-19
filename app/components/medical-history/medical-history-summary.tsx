import {
  formatDatedHistoryItem,
  type DatedHistoryItem,
  type MedicalHistoryInput,
} from '~/validation/medical-history';

type MedicalHistoryRecord = MedicalHistoryInput & {
  gynecoObstetricHistory: string | null;
};

type TextItem = {
  id: keyof MedicalHistoryRecord;
  label: string;
  kind: 'text';
};

type DatedItem = {
  id: keyof MedicalHistoryRecord;
  label: string;
  kind: 'dated';
};

type Item = TextItem | DatedItem;

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Motivo de consulta',
    items: [{ id: 'chiefComplaint', label: 'Motivo de consulta', kind: 'text' }],
  },
  {
    title: 'Antecedentes personales',
    items: [
      { id: 'personalHistory1', label: 'Personales 1 — Diagnósticos dados', kind: 'dated' },
      { id: 'personalHistory2', label: 'Personales 2 — Diagnósticos en estudio', kind: 'dated' },
      { id: 'surgicalHistory', label: 'Quirúrgicos', kind: 'dated' },
      { id: 'medications', label: 'Medicamentosos', kind: 'dated' },
      { id: 'supplements', label: 'Suplementos', kind: 'dated' },
      { id: 'diet', label: 'Alimentación / dieta', kind: 'dated' },
      { id: 'infectiousHistory', label: 'Infecciosos (recurrentes)', kind: 'text' },
      { id: 'traumaticHistory', label: 'Traumáticos', kind: 'text' },
      { id: 'toxicologicalHistory', label: 'Toxicológicos', kind: 'dated' },
      { id: 'allergies', label: 'Alergias', kind: 'text' },
      { id: 'vaccines', label: 'Vacunas *', kind: 'text' },
      { id: 'habits', label: 'Hábitos', kind: 'text' },
      { id: 'gynecoObstetricHistory', label: 'Ginecoobstétricos *', kind: 'text' },
    ],
  },
  {
    title: 'Antecedentes familiares y psicosociales',
    items: [
      { id: 'familyHistory', label: 'Familiares', kind: 'text' },
      { id: 'psychosocialHistory', label: 'Psicosociales *', kind: 'text' },
    ],
  },
  {
    title: 'Notas',
    items: [{ id: 'notes', label: 'Notas adicionales', kind: 'text' }],
  },
];

function hasContent(medicalHistory: MedicalHistoryRecord, item: Item) {
  const value = medicalHistory[item.id];
  if (item.kind === 'dated') {
    return Array.isArray(value) && value.length > 0;
  }

  return Boolean(value);
}

function renderValue(medicalHistory: MedicalHistoryRecord, item: Item) {
  const value = medicalHistory[item.id];
  if (item.kind === 'dated' && Array.isArray(value)) {
    return (
      <ul className="mt-1 space-y-1 text-sm leading-relaxed text-slate-700">
        {(value as DatedHistoryItem[]).map((entry, index) => (
          <li key={index}>{formatDatedHistoryItem(entry)}</li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
      {typeof value === 'string' ? value : ''}
    </p>
  );
}

// Read-only view for a confirmed (legally locked) medical history record.
export function MedicalHistorySummary({ medicalHistory }: { medicalHistory: MedicalHistoryRecord }) {
  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => {
        const visibleItems = section.items.filter((item) => hasContent(medicalHistory, item));

        if (visibleItems.length === 0) {
          return null;
        }

        return (
          <section
            key={section.title}
            className="space-y-4 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-900">
              {section.title}
            </h3>
            <dl className="space-y-4">
              {visibleItems.map((item) => (
                <div key={item.id}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </dt>
                  <dd>{renderValue(medicalHistory, item)}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
