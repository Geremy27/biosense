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

const lifestyleKeyNumberSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const lifestyleBaseSchema = z.object({
  guidance: z.string(),
  rationale: z.string(),
  patientSummary: z.string().default(''),
  keyNumbers: z.array(lifestyleKeyNumberSchema).max(4).default([]),
});

const nutrientSourceSchema = z.object({
  nutrient: z.string(),
  amount: z.string().nullable(),
  foods: z.array(z.string()).default([]),
  localProducts: z.array(z.string()).default([]),
});

const nutritionBlockSchema = z.object({
  targets: z.string().default(''),
  sources: z.array(nutrientSourceSchema).default([]),
});

export const nutritionLifestyleSchema = lifestyleBaseSchema.extend({
  dietType: z.string().nullable().default(null),
  macros: nutritionBlockSchema.default({ targets: '', sources: [] }),
  micros: nutritionBlockSchema.default({ targets: '', sources: [] }),
});

export const exerciseLifestyleSchema = lifestyleBaseSchema.extend({
  type: z.string().default(''),
  duration: z.string().default(''),
  intensity: z.string().default(''),
  intensityExplanation: z.string().default(''),
});

export const mentalSleepLifestyleSchema = lifestyleBaseSchema.extend({
  practices: z
    .array(
      z.object({
        what: z.string(),
        howToKnow: z.string(),
      }),
    )
    .default([]),
});

function asLifestyleBase(value: unknown) {
  if (typeof value === 'string') {
    return { guidance: value, rationale: '', patientSummary: '', keyNumbers: [] };
  }

  if (!value || typeof value !== 'object') {
    return { guidance: '', rationale: '', patientSummary: '', keyNumbers: [] };
  }

  return value;
}

function asNutritionLifestyle(value: unknown) {
  const base = asLifestyleBase(value);
  const parsed = nutritionLifestyleSchema.safeParse(base);
  if (parsed.success) {
    return parsed.data;
  }

  return nutritionLifestyleSchema.parse({
    ...base,
    dietType: null,
    macros: { targets: '', sources: [] },
    micros: { targets: '', sources: [] },
  });
}

function asExerciseLifestyle(value: unknown) {
  const base = asLifestyleBase(value);
  const parsed = exerciseLifestyleSchema.safeParse(base);
  if (parsed.success) {
    return parsed.data;
  }

  return exerciseLifestyleSchema.parse({
    ...base,
    type: '',
    duration: '',
    intensity: '',
    intensityExplanation: '',
  });
}

function asMentalSleepLifestyle(value: unknown) {
  const base = asLifestyleBase(value);
  const parsed = mentalSleepLifestyleSchema.safeParse(base);
  if (parsed.success) {
    return parsed.data;
  }

  return mentalSleepLifestyleSchema.parse({
    ...base,
    practices: [],
  });
}

export const shareableSectionValues = [
  'context',
  'executiveSummary',
  'conclusions',
  'recommendations',
  'lifestyle',
  'supplements',
] as const;

export type ShareableSection = (typeof shareableSectionValues)[number];

export const recommendationOutputSchema = z.object({
  patientContextEcho: z.object({
    ageYears: z.number(),
    sex: z.string().nullable(),
  }),
  executiveSummary: z.array(z.string()).max(4).default([]),
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
    nutrition: nutritionLifestyleSchema,
    exercise: exerciseLifestyleSchema,
    mentalAndSleep: mentalSleepLifestyleSchema,
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
          typeof item === 'string' ? { statement: item, rationale: '' } : item,
        )
      : [],
    recommendations: Array.isArray(legacy.recommendations)
      ? legacy.recommendations.map((item) =>
          typeof item === 'string' ? { action: item, rationale: '' } : item,
        )
      : [],
    lifestyle: legacy.lifestyle
      ? {
          nutrition: asNutritionLifestyle(legacy.lifestyle.nutrition),
          exercise: asExerciseLifestyle(legacy.lifestyle.exercise),
          mentalAndSleep: asMentalSleepLifestyle(legacy.lifestyle.mentalAndSleep),
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

export const recommendationEditInputSchema = z.object({
  executiveSummary: z.array(z.string().trim().min(1)).max(4),
  conclusions: z.array(conclusionItemSchema).max(3),
  recommendations: z.array(recommendationItemSchema),
  lifestyle: z.object({
    nutrition: nutritionLifestyleSchema,
    exercise: exerciseLifestyleSchema,
    mentalAndSleep: mentalSleepLifestyleSchema,
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
});

export type RecommendationEditInput = z.infer<typeof recommendationEditInputSchema>;

export function parseRecommendationEditFormData(formData: FormData) {
  try {
    return recommendationEditInputSchema.safeParse({
      executiveSummary: JSON.parse(String(formData.get('executiveSummaryJson') ?? '[]')),
      conclusions: JSON.parse(String(formData.get('conclusionsJson') ?? '[]')),
      recommendations: JSON.parse(String(formData.get('recommendationsJson') ?? '[]')),
      possibleSupplements: JSON.parse(String(formData.get('possibleSupplementsJson') ?? '[]')),
      lifestyle: JSON.parse(String(formData.get('lifestyleJson') ?? '{}')),
    });
  } catch {
    return recommendationEditInputSchema.safeParse(null);
  }
}

export function parseShareSectionsFormData(formData: FormData) {
  const selected = formData.getAll('sections').map((value) => String(value));
  return selected.filter((value): value is ShareableSection =>
    (shareableSectionValues as readonly string[]).includes(value),
  );
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
