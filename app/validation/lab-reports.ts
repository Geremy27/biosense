import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable();

const labAnalyteSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del parámetro es obligatorio.'),
  value: z.string().trim().min(1, 'El valor es obligatorio.'),
  unit: optionalText,
  referenceRange: optionalText,
  optimalRange: optionalText,
  flag: optionalText,
});

export const confirmLabReportSchema = z.object({
  labName: optionalText,
  panelName: optionalText,
  collectedAt: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .refine(
      (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
      'Ingresa una fecha válida.',
    ),
  analytes: z
    .array(labAnalyteSchema)
    .min(1, 'Agrega al menos un resultado.')
    .max(500, 'El informe no puede tener más de 500 resultados.'),
});

export type ConfirmLabReportInput = z.infer<typeof confirmLabReportSchema>;

export function parseConfirmLabReportFormData(formData: FormData) {
  let analytes: unknown = [];

  try {
    analytes = JSON.parse(String(formData.get('analytesJson') ?? '[]'));
  } catch {
    return confirmLabReportSchema.safeParse({
      labName: formData.get('labName'),
      panelName: formData.get('panelName'),
      collectedAt: formData.get('collectedAt'),
      analytes: null,
    });
  }

  return confirmLabReportSchema.safeParse({
    labName: String(formData.get('labName') ?? ''),
    panelName: String(formData.get('panelName') ?? ''),
    collectedAt: String(formData.get('collectedAt') ?? ''),
    analytes,
  });
}
