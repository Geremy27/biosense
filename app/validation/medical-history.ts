import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable();

export const medicalHistoryInputSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio.'),
  recordedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Indica una fecha válida (AAAA-MM-DD).'),
  chiefComplaint: optionalText,
  personalHistory1: optionalText,
  personalHistory2: optionalText,
  surgicalHistory: optionalText,
  medications: optionalText,
  supplements: optionalText,
  infectiousHistory: optionalText,
  traumaticHistory: optionalText,
  toxicologicalHistory: optionalText,
  allergies: optionalText,
  vaccines: optionalText,
  habits: optionalText,
  gynecoObstetricHistory: optionalText,
  familyHistory: optionalText,
  psychosocialHistory: optionalText,
  notes: optionalText,
});

export type MedicalHistoryInput = z.infer<typeof medicalHistoryInputSchema>;

const MEDICAL_HISTORY_FIELDS = [
  'title',
  'recordedAt',
  'chiefComplaint',
  'personalHistory1',
  'personalHistory2',
  'surgicalHistory',
  'medications',
  'supplements',
  'infectiousHistory',
  'traumaticHistory',
  'toxicologicalHistory',
  'allergies',
  'vaccines',
  'habits',
  'gynecoObstetricHistory',
  'familyHistory',
  'psychosocialHistory',
  'notes',
] as const;

export function parseMedicalHistoryFormData(formData: FormData) {
  const raw = Object.fromEntries(
    MEDICAL_HISTORY_FIELDS.map((field) => [field, String(formData.get(field) ?? '')]),
  );

  return medicalHistoryInputSchema.safeParse(raw);
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
