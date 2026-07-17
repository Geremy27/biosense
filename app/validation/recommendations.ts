import { z } from 'zod';

export const findingDomainValues = [
  'inflamatorio',
  'metabolico',
  'hepatico',
  'lipidico',
  'hormonal',
  'hematologico',
  'otro',
] as const;

export const findingSeverityValues = ['normal', 'atencion', 'alto', 'incierto'] as const;

export const recommendationOutputSchema = z.object({
  patientContextEcho: z.object({
    ageYears: z.number(),
    sex: z.string().nullable(),
  }),
  findings: z.array(
    z.object({
      domain: z.enum(findingDomainValues),
      title: z.string(),
      interpretation: z.string(),
      severity: z.enum(findingSeverityValues),
      uncertain: z.boolean(),
    }),
  ),
  derivedMetrics: z.array(
    z.object({
      name: z.string(),
      value: z.string().nullable(),
      unit: z.string().nullable(),
      note: z.string().nullable(),
      uncertain: z.boolean(),
    }),
  ),
  medicationConsiderationNote: z.string(),
  conclusions: z.array(z.string()).max(3),
  recommendations: z.array(z.string()),
  lifestyle: z.object({
    nutrition: z.string(),
    exercise: z.string(),
    mentalAndSleep: z.string(),
  }),
  possibleSupplements: z
    .array(
      z.object({
        name: z.string(),
        dose: z.string().nullable(),
        rationale: z.string(),
        requiresMoreLabs: z.boolean(),
        missingLabs: z.string().nullable(),
      }),
    )
    .max(3),
  missingInformation: z.array(z.string()),
});

export type RecommendationOutput = z.infer<typeof recommendationOutputSchema>;

export function asRecommendationOutput(value: unknown): RecommendationOutput | null {
  const result = recommendationOutputSchema.safeParse(value);
  return result.success ? result.data : null;
}

export const generateRecommendationInputSchema = z.object({
  labReportId: z.string().uuid({ message: 'Selecciona un laboratorio confirmado.' }),
  systemPrompt: z.string().trim().min(1, 'El system prompt es obligatorio.'),
  userPromptTemplate: z.string().trim().min(1, 'El user prompt es obligatorio.'),
  model: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .nullable(),
  medicationsText: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .nullable(),
});

export type GenerateRecommendationInput = z.infer<typeof generateRecommendationInputSchema>;

export function parseGenerateRecommendationFormData(formData: FormData) {
  return generateRecommendationInputSchema.safeParse({
    labReportId: String(formData.get('labReportId') ?? ''),
    systemPrompt: String(formData.get('systemPrompt') ?? ''),
    userPromptTemplate: String(formData.get('userPromptTemplate') ?? ''),
    model: String(formData.get('model') ?? ''),
    medicationsText: String(formData.get('medicationsText') ?? ''),
  });
}

export const recommendationPromptInputSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  systemPrompt: z.string().trim().min(1, 'El system prompt es obligatorio.'),
  userPromptTemplate: z.string().trim().min(1, 'El user prompt es obligatorio.'),
  model: z.string().trim().min(1, 'El modelo es obligatorio.'),
  isActive: z
    .string()
    .optional()
    .transform((value) => value === 'on' || value === 'true'),
});

export type RecommendationPromptInput = z.infer<typeof recommendationPromptInputSchema>;

export function parseRecommendationPromptFormData(formData: FormData) {
  return recommendationPromptInputSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    systemPrompt: String(formData.get('systemPrompt') ?? ''),
    userPromptTemplate: String(formData.get('userPromptTemplate') ?? ''),
    model: String(formData.get('model') ?? ''),
    isActive: String(formData.get('isActive') ?? ''),
  });
}
