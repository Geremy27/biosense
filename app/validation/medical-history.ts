import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable();

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Indica una fecha válida (AAAA-MM-DD).');

export const datedHistoryItemSchema = z
  .object({
    label: z.string().trim().min(1, 'El nombre es obligatorio.'),
    detail: z
      .string()
      .trim()
      .transform((value) => (value === '' ? null : value))
      .nullable(),
    from: dateString,
    to: z
      .string()
      .trim()
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: 'Indica una fecha válida (AAAA-MM-DD).',
      }),
  })
  .superRefine((item, ctx) => {
    if (item.to && item.to < item.from) {
      ctx.addIssue({
        code: 'custom',
        message: 'La fecha fin no puede ser anterior a la fecha inicio.',
        path: ['to'],
      });
    }
  });

export type DatedHistoryItem = z.infer<typeof datedHistoryItemSchema>;

const datedItemsField = z.array(datedHistoryItemSchema).default([]);

export const medicalHistoryInputSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio.'),
  recordedAt: dateString,
  chiefComplaint: optionalText,
  personalHistory1: datedItemsField,
  personalHistory2: datedItemsField,
  surgicalHistory: datedItemsField,
  medications: datedItemsField,
  supplements: datedItemsField,
  diet: datedItemsField,
  infectiousHistory: optionalText,
  traumaticHistory: optionalText,
  toxicologicalHistory: datedItemsField,
  allergies: optionalText,
  vaccines: optionalText,
  habits: optionalText,
  gynecoObstetricHistory: optionalText,
  familyHistory: optionalText,
  psychosocialHistory: optionalText,
  notes: optionalText,
});

export type MedicalHistoryInput = z.infer<typeof medicalHistoryInputSchema>;

export const DATED_HISTORY_FIELDS = [
  'personalHistory1',
  'personalHistory2',
  'surgicalHistory',
  'medications',
  'supplements',
  'diet',
  'toxicologicalHistory',
] as const;

export type DatedHistoryField = (typeof DATED_HISTORY_FIELDS)[number];

const TEXT_HISTORY_FIELDS = [
  'title',
  'recordedAt',
  'chiefComplaint',
  'infectiousHistory',
  'traumaticHistory',
  'allergies',
  'vaccines',
  'habits',
  'gynecoObstetricHistory',
  'familyHistory',
  'psychosocialHistory',
  'notes',
] as const;

function parseDatedItemsJson(raw: string, field: DatedHistoryField): unknown {
  if (!raw.trim()) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [{ label: '', detail: null, from: '', to: null, _parseError: field }];
  }
}

export function parseMedicalHistoryFormData(formData: FormData) {
  const raw: Record<string, unknown> = Object.fromEntries(
    TEXT_HISTORY_FIELDS.map((field) => [field, String(formData.get(field) ?? '')]),
  );

  for (const field of DATED_HISTORY_FIELDS) {
    raw[field] = parseDatedItemsJson(String(formData.get(`${field}Json`) ?? ''), field);
  }

  return medicalHistoryInputSchema.safeParse(raw);
}

export function formatDatedHistoryItem(item: DatedHistoryItem) {
  const range = item.to ? `${item.from} → ${item.to}` : `${item.from} → actualidad`;
  if (item.detail) {
    return `${item.label} (${range}): ${item.detail}`;
  }

  return `${item.label} (${range})`;
}

export function formatDatedHistoryItems(items: DatedHistoryItem[] | null | undefined) {
  if (!items || items.length === 0) {
    return null;
  }

  return items.map(formatDatedHistoryItem).join('\n');
}

export function emptyMedicalHistoryClinicalDefaults(): Pick<
  MedicalHistoryInput,
  | DatedHistoryField
  | 'chiefComplaint'
  | 'infectiousHistory'
  | 'traumaticHistory'
  | 'allergies'
  | 'vaccines'
  | 'habits'
  | 'gynecoObstetricHistory'
  | 'familyHistory'
  | 'psychosocialHistory'
  | 'notes'
> {
  return {
    chiefComplaint: null,
    personalHistory1: [],
    personalHistory2: [],
    surgicalHistory: [],
    medications: [],
    supplements: [],
    diet: [],
    infectiousHistory: null,
    traumaticHistory: null,
    toxicologicalHistory: [],
    allergies: null,
    vaccines: null,
    habits: null,
    gynecoObstetricHistory: null,
    familyHistory: null,
    psychosocialHistory: null,
    notes: null,
  };
}

export function clinicalDefaultsFromHistory(
  history: Partial<MedicalHistoryInput>,
): ReturnType<typeof emptyMedicalHistoryClinicalDefaults> {
  return {
    chiefComplaint: history.chiefComplaint ?? null,
    personalHistory1: history.personalHistory1 ?? [],
    personalHistory2: history.personalHistory2 ?? [],
    surgicalHistory: history.surgicalHistory ?? [],
    medications: history.medications ?? [],
    supplements: history.supplements ?? [],
    diet: history.diet ?? [],
    infectiousHistory: history.infectiousHistory ?? null,
    traumaticHistory: history.traumaticHistory ?? null,
    toxicologicalHistory: history.toxicologicalHistory ?? [],
    allergies: history.allergies ?? null,
    vaccines: history.vaccines ?? null,
    habits: history.habits ?? null,
    gynecoObstetricHistory: history.gynecoObstetricHistory ?? null,
    familyHistory: history.familyHistory ?? null,
    psychosocialHistory: history.psychosocialHistory ?? null,
    notes: history.notes ?? null,
  };
}

/** Prefer extracted values; fill empty dated lists / blank text from the previous history. */
export function mergeClinicalHistoryFromPrevious(
  extracted: ReturnType<typeof emptyMedicalHistoryClinicalDefaults>,
  previous: Partial<MedicalHistoryInput> | null,
): ReturnType<typeof emptyMedicalHistoryClinicalDefaults> {
  if (!previous) {
    return extracted;
  }

  const fallback = clinicalDefaultsFromHistory(previous);

  return {
    chiefComplaint: extracted.chiefComplaint ?? fallback.chiefComplaint,
    personalHistory1: firstNonEmptyItems(extracted.personalHistory1, fallback.personalHistory1),
    personalHistory2: firstNonEmptyItems(extracted.personalHistory2, fallback.personalHistory2),
    surgicalHistory: firstNonEmptyItems(extracted.surgicalHistory, fallback.surgicalHistory),
    medications: firstNonEmptyItems(extracted.medications, fallback.medications),
    supplements: firstNonEmptyItems(extracted.supplements, fallback.supplements),
    diet: firstNonEmptyItems(extracted.diet, fallback.diet),
    infectiousHistory: extracted.infectiousHistory ?? fallback.infectiousHistory,
    traumaticHistory: extracted.traumaticHistory ?? fallback.traumaticHistory,
    toxicologicalHistory: firstNonEmptyItems(
      extracted.toxicologicalHistory,
      fallback.toxicologicalHistory,
    ),
    allergies: extracted.allergies ?? fallback.allergies,
    vaccines: extracted.vaccines ?? fallback.vaccines,
    habits: extracted.habits ?? fallback.habits,
    gynecoObstetricHistory: extracted.gynecoObstetricHistory ?? fallback.gynecoObstetricHistory,
    familyHistory: extracted.familyHistory ?? fallback.familyHistory,
    psychosocialHistory: extracted.psychosocialHistory ?? fallback.psychosocialHistory,
    notes: extracted.notes ?? fallback.notes,
  };
}

function firstNonEmptyItems(extracted: DatedHistoryItem[], fallback: DatedHistoryItem[]) {
  if (extracted.length > 0) {
    return extracted;
  }

  return fallback;
}

export const confirmMedicalHistoryInputSchema = z.object({
  acknowledged: z
    .string()
    .optional()
    .transform((value) => value === 'on' || value === 'true')
    .refine((value) => value === true, {
      message: 'Debes confirmar que entiendes que este antecedente quedará bloqueado.',
    }),
});

export type ConfirmMedicalHistoryInput = z.infer<typeof confirmMedicalHistoryInputSchema>;

export function parseConfirmMedicalHistoryFormData(formData: FormData) {
  return confirmMedicalHistoryInputSchema.safeParse({
    acknowledged: String(formData.get('acknowledged') ?? ''),
  });
}
