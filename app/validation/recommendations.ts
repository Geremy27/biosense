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

const conclusionItemSchema = z.object({
  statement: z.string(),
  rationale: z.string(),
});

const recommendationItemSchema = z.object({
  action: z.string(),
  rationale: z.string(),
});

const lifestyleItemSchema = z.object({
  guidance: z.string(),
  rationale: z.string(),
});

function asLifestyleItem(value: unknown) {
  if (typeof value === 'string') {
    return { guidance: value, rationale: '' };
  }

  return value;
}

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
  conclusions: z.array(conclusionItemSchema).max(3),
  recommendations: z.array(recommendationItemSchema),
  lifestyle: z.object({
    nutrition: lifestyleItemSchema,
    exercise: lifestyleItemSchema,
    mentalAndSleep: lifestyleItemSchema,
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

/** Accepts current schema or legacy string conclusions/recommendations/lifestyle. */
export function asRecommendationOutput(value: unknown): RecommendationOutput | null {
  const result = recommendationOutputSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const legacy = value as {
    conclusions?: unknown;
    recommendations?: unknown;
    lifestyle?: {
      nutrition?: unknown;
      exercise?: unknown;
      mentalAndSleep?: unknown;
    };
  };

  const normalized = {
    ...value,
    conclusions: Array.isArray(legacy.conclusions)
      ? legacy.conclusions.map((item) =>
          typeof item === 'string'
            ? { statement: item, rationale: '' }
            : item,
        )
      : [],
    recommendations: Array.isArray(legacy.recommendations)
      ? legacy.recommendations.map((item) =>
          typeof item === 'string'
            ? { action: item, rationale: '' }
            : item,
        )
      : [],
    lifestyle: legacy.lifestyle
      ? {
          nutrition: asLifestyleItem(legacy.lifestyle.nutrition),
          exercise: asLifestyleItem(legacy.lifestyle.exercise),
          mentalAndSleep: asLifestyleItem(legacy.lifestyle.mentalAndSleep),
        }
      : undefined,
  };

  const retry = recommendationOutputSchema.safeParse(normalized);
  return retry.success ? retry.data : null;
}

export const generateRecommendationInputSchema = z.object({
  labReportId: z.string().uuid({ message: 'Selecciona un laboratorio confirmado.' }),
  medicalHistoryId: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .pipe(z.string().uuid({ message: 'Selecciona antecedentes válidos.' }).nullable()),
  systemPrompt: z.string().trim().min(1, 'El system prompt es obligatorio.'),
  instructions: z.string().trim().min(1, 'Las instrucciones son obligatorias.'),
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
    medicalHistoryId: String(formData.get('medicalHistoryId') ?? ''),
    systemPrompt: String(formData.get('systemPrompt') ?? ''),
    instructions: String(formData.get('instructions') ?? ''),
    model: String(formData.get('model') ?? ''),
    medicationsText: String(formData.get('medicationsText') ?? ''),
  });
}

export const recommendationPromptInputSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  systemPrompt: z.string().trim().min(1, 'El system prompt es obligatorio.'),
  userPromptTemplate: z.string().trim().min(1, 'Las instrucciones son obligatorias.'),
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
