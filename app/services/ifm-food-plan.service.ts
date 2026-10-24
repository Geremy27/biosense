import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

import { loadIfmFoodPlanBundle } from '~/knowledge/ifm/load-bundle';
import {
  ifmCalorieTierValues,
  ifmPlanKeyValues,
  type IfmCalorieTier,
  type IfmFoodPlanSelection,
  type IfmPlanKey,
} from '~/knowledge/ifm/types';

import type {
  DeidentifiedPatientSnapshot,
  LabSnapshot,
  MedicalHistorySnapshot,
} from './clinical-recommendation-snapshots';

const ifmPlanSelectionSchema = z.object({
  planKey: z.enum(ifmPlanKeyValues),
  calorieTier: z.enum(ifmCalorieTierValues).nullable(),
  rationale: z.string(),
});

const IFM_SELECTION_SYSTEM_PROMPT = `Eres un médico funcional que elige UN plan alimenticio IFM para un paciente concreto.
Usa la matriz "Features of the IFM Food Plans" y las distribuciones de macronutrientes provistas.
Elige exactamente un planKey de la lista permitida.
Para core y cardiometabolic debes elegir también calorieTier (1200-1400, 1400-1800 o 1800-2200) según edad, sexo, BMI, actividad inferida y objetivo clínico.
Para los demás planes, calorieTier debe ser null.
Usa core_vegan o core_vegetarian solo si la historia/dieta del paciente indica veganismo o vegetarianismo estricto; si no, prefiere core o el plan terapéutico indicado por los datos.
Responde en español en rationale (2-4 oraciones, datos del paciente anclando la elección).`;

export type SelectIfmFoodPlanInput = {
  patientSnapshot: DeidentifiedPatientSnapshot;
  labSnapshot: LabSnapshot;
  medicalHistorySnapshot: MedicalHistorySnapshot | null;
  medicationsText: string | null;
  model: string;
};

export async function selectIfmFoodPlan(
  input: SelectIfmFoodPlanInput,
): Promise<IfmFoodPlanSelection & { model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const bundle = loadIfmFoodPlanBundle();
  const client = new OpenAI({ apiKey });

  const userPrompt = [
    '## Matriz de características IFM',
    bundle.featuresText,
    '',
    '## Distribuciones de macronutrientes IFM',
    bundle.macronutrientsText,
    '',
    '## Datos del paciente (sin identificadores)',
    JSON.stringify(input.patientSnapshot, null, 2),
    '',
    '## Laboratorio',
    JSON.stringify(input.labSnapshot, null, 2),
    '',
    '## Antecedentes',
    input.medicalHistorySnapshot
      ? JSON.stringify(input.medicalHistorySnapshot, null, 2)
      : 'No registrados.',
    '',
    '## Medicación y suplementos',
    input.medicationsText ?? 'Ninguna reportada.',
    '',
    'Elige planKey y calorieTier (si aplica).',
  ].join('\n');

  const response = await client.responses.parse({
    model: input.model,
    input: [
      { role: 'system', content: IFM_SELECTION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    text: {
      format: zodTextFormat(ifmPlanSelectionSchema, 'ifm_food_plan_selection'),
    },
  });

  if (!response.output_parsed) {
    throw new Error('The model did not return IFM food plan selection');
  }

  const selection = normalizeIfmSelection(response.output_parsed);
  return { ...selection, model: input.model };
}

export function buildIfmFoodPlanContext(selection: IfmFoodPlanSelection): string {
  const bundle = loadIfmFoodPlanBundle();
  const plan = bundle.plans[selection.planKey];
  if (!plan) {
    return '';
  }

  let planText = plan.documents.default ?? '';
  if (plan.supportsCalorieTiers && selection.calorieTier) {
    planText = plan.documents[selection.calorieTier] ?? planText;
  }

  return [
    '## Referencia IFM (plan seleccionado para esta generación)',
    `Plan: ${plan.displayName} (${selection.planKey})`,
    selection.calorieTier ? `Banda calórica: ${selection.calorieTier} kcal/día` : '',
    `Criterio de selección: ${selection.rationale}`,
    '',
    '### Fitonutrientes (aplicar junto con el plan cuando corresponda)',
    bundle.phytonutrientText,
    '',
    '### Detalle del plan (porciones, categorías, eliminar/limitar)',
    planText,
    '',
    'Instrucciones de uso:',
    `- Alinea lifestyle.nutrition.dietType con: ${plan.mapsToDietType}.`,
    '- Respeta listas Eliminar/Limitar; no recomiendes alimentos prohibidos por el plan.',
    '- Usa las porciones del plan como guía; adapta alimentos con el catálogo local del paciente.',
    '- Los extractos son guía clínica, no datos del paciente.',
  ]
    .filter(Boolean)
    .join('\n');
}

function normalizeIfmSelection(parsed: z.infer<typeof ifmPlanSelectionSchema>): IfmFoodPlanSelection {
  const bundle = loadIfmFoodPlanBundle();
  const plan = bundle.plans[parsed.planKey as IfmPlanKey];
  let calorieTier: IfmCalorieTier | null = parsed.calorieTier;

  if (!plan?.supportsCalorieTiers) {
    calorieTier = null;
  } else if (!calorieTier) {
    calorieTier = '1400-1800';
  }

  return {
    planKey: parsed.planKey,
    calorieTier,
    rationale: parsed.rationale.trim(),
  };
}
