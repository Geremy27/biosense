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
  personalHistory: optionalText,
  familyHistory: optionalText,
  surgicalHistory: optionalText,
  allergies: optionalText,
  medicationsAndSupplements: optionalText,
  habitsLifestyle: optionalText,
  notes: optionalText,
});

export type MedicalHistoryInput = z.infer<typeof medicalHistoryInputSchema>;

export function parseMedicalHistoryFormData(formData: FormData) {
  return medicalHistoryInputSchema.safeParse({
    title: String(formData.get('title') ?? ''),
    recordedAt: String(formData.get('recordedAt') ?? ''),
    chiefComplaint: String(formData.get('chiefComplaint') ?? ''),
    personalHistory: String(formData.get('personalHistory') ?? ''),
    familyHistory: String(formData.get('familyHistory') ?? ''),
    surgicalHistory: String(formData.get('surgicalHistory') ?? ''),
    allergies: String(formData.get('allergies') ?? ''),
    medicationsAndSupplements: String(formData.get('medicationsAndSupplements') ?? ''),
    habitsLifestyle: String(formData.get('habitsLifestyle') ?? ''),
    notes: String(formData.get('notes') ?? ''),
  });
}
