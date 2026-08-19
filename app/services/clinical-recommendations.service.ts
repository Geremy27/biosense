import { AuditAction, ClinicalRecommendationStatus, LabReportStatus, Sex } from '~/db/models/enums';
import type { MedicalHistoryDatedItem } from '~/db/models/patient-medical-histories';
import {
  confirmClinicalRecommendationRow,
  findClinicalRecommendationByPatientAndId,
  findClinicalRecommendationsByPatientId,
  findLabAnalytesByReportId,
  findLabReportByPatientAndId,
  findMedicalHistoryByPatientAndId,
  findNutritionRegionById,
  findPatientById,
  insertClinicalRecommendation,
  listActiveLocalProductsByRegionId,
  unlockClinicalRecommendationRow,
  updateClinicalRecommendation,
  updateClinicalRecommendationOutput,
  updateClinicalRecommendationShareSections,
} from '~/db/repositories';
import { formatSex } from '~/utils/patient-display';
import { formatDatedHistoryItems } from '~/validation/medical-history';
import {
  asRecommendationOutput,
  parseGenerateRecommendationFormData,
  parseRecommendationEditFormData,
  parseShareSectionsFormData,
  type GenerateRecommendationInput,
  type RecommendationEditInput,
} from '~/validation/recommendations';
import { zodFieldErrors } from '~/validation/zod-errors';

import { record } from './audit.service';
import { assertPatientAccess, assertProvider } from './authz';
import type { ActorContext } from './context';
import { generateRecommendationOutput } from './recommendation-generation.service';

export class ClinicalRecommendationValidationError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super('Validation failed');
    this.name = 'ClinicalRecommendationValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export type DeidentifiedPatientSnapshot = {
  ageYears: number;
  sex: string | null;
  ethnicity: string | null;
  heightCm: string | null;
  weightKg: string | null;
  bmi: number | null;
  residencePlace: string | null;
  residenceRegion: string | null;
};

export type LocalFoodSnapshot = {
  name: string;
  role: string;
  nutrients: string[];
  notes: string | null;
};

export type LabSnapshot = {
  collectedAt: string | null;
  labName: string | null;
  panelName: string | null;
  analytes: Array<{
    name: string;
    value: string;
    unit: string | null;
    referenceRange: string | null;
    optimalRange: string | null;
    flag: string | null;
  }>;
};

export type MedicalHistorySnapshot = {
  title: string;
  recordedAt: string;
  chiefComplaint: string | null;
  personalHistory1: MedicalHistoryDatedItem[];
  personalHistory2: MedicalHistoryDatedItem[];
  surgicalHistory: MedicalHistoryDatedItem[];
  medications: MedicalHistoryDatedItem[];
  supplements: MedicalHistoryDatedItem[];
  diet: MedicalHistoryDatedItem[];
  infectiousHistory: string | null;
  traumaticHistory: string | null;
  toxicologicalHistory: MedicalHistoryDatedItem[];
  allergies: string | null;
  vaccines: string | null;
  habits: string | null;
  gynecoObstetricHistory: string | null;
  familyHistory: string | null;
  psychosocialHistory: string | null;
  notes: string | null;
};

export async function listClinicalRecommendations(ctx: ActorContext, patientId: string) {
  await assertRecommendationPatientAccess(ctx, patientId);
  const rows = await findClinicalRecommendationsByPatientId(patientId);

  await record(ctx, {
    action: AuditAction.LIST,
    entityType: 'clinical_recommendation',
    patientId,
    metadata: { count: rows.length },
  });

  return rows;
}

export async function getClinicalRecommendation(
  ctx: ActorContext,
  patientId: string,
  recommendationId: string,
) {
  await assertRecommendationPatientAccess(ctx, patientId);
  const row = await findClinicalRecommendationByPatientAndId(patientId, recommendationId);

  await record(ctx, {
    action: AuditAction.VIEW,
    entityType: 'clinical_recommendation',
    entityId: recommendationId,
    patientId,
    metadata: { found: row !== null },
  });

  return row;
}

export async function generateClinicalRecommendation(
  ctx: ActorContext,
  patientId: string,
  input: GenerateRecommendationInput,
) {
  assertProvider(ctx);
  const patient = await assertRecommendationPatientAccess(ctx, patientId);

  const labReport = await findLabReportByPatientAndId(patientId, input.labReportId);
  if (!labReport) {
    throw new ClinicalRecommendationValidationError({
      labReportId: 'Laboratorio no encontrado.',
    });
  }

  if (labReport.status !== LabReportStatus.CONFIRMED) {
    throw new ClinicalRecommendationValidationError({
      labReportId: 'Solo puedes usar laboratorios confirmados.',
    });
  }

  const analytes = await findLabAnalytesByReportId(labReport.id);
  if (analytes.length === 0) {
    throw new ClinicalRecommendationValidationError({
      labReportId: 'El laboratorio no tiene valores confirmados.',
    });
  }

  let medicalHistorySnapshot: MedicalHistorySnapshot | null = null;
  if (input.medicalHistoryId) {
    const medicalHistory = await findMedicalHistoryByPatientAndId(
      patientId,
      input.medicalHistoryId,
    );
    if (!medicalHistory) {
      throw new ClinicalRecommendationValidationError({
        medicalHistoryId: 'Antecedentes no encontrados.',
      });
    }

    medicalHistorySnapshot = {
      title: medicalHistory.title,
      recordedAt: medicalHistory.recordedAt,
      chiefComplaint: medicalHistory.chiefComplaint,
      personalHistory1: medicalHistory.personalHistory1 ?? [],
      personalHistory2: medicalHistory.personalHistory2 ?? [],
      surgicalHistory: medicalHistory.surgicalHistory ?? [],
      medications: medicalHistory.medications ?? [],
      supplements: medicalHistory.supplements ?? [],
      diet: medicalHistory.diet ?? [],
      infectiousHistory: medicalHistory.infectiousHistory,
      traumaticHistory: medicalHistory.traumaticHistory,
      toxicologicalHistory: medicalHistory.toxicologicalHistory ?? [],
      allergies: medicalHistory.allergies,
      vaccines: medicalHistory.vaccines,
      habits: medicalHistory.habits,
      gynecoObstetricHistory: medicalHistory.gynecoObstetricHistory,
      familyHistory: medicalHistory.familyHistory,
      psychosocialHistory: medicalHistory.psychosocialHistory,
      notes: medicalHistory.notes,
    };
  }

  const residenceRegion = patient.residenceRegionId
    ? await findNutritionRegionById(patient.residenceRegionId)
    : null;
  const localFoods: LocalFoodSnapshot[] = patient.residenceRegionId
    ? await listActiveLocalProductsByRegionId(patient.residenceRegionId)
    : [];

  const patientSnapshot = buildPatientSnapshot(patient, residenceRegion?.name ?? null);
  const labSnapshot: LabSnapshot = {
    collectedAt: labReport.collectedAt,
    labName: labReport.labName,
    panelName: labReport.panelName,
    analytes: analytes.map((analyte) => ({
      name: analyte.name,
      value: analyte.value,
      unit: analyte.unit,
      referenceRange: analyte.referenceRange,
      optimalRange: analyte.optimalRange,
      flag: analyte.flag,
    })),
  };

  const medicationsAndSupplementsText =
    [
      formatDatedHistoryItems(medicalHistorySnapshot?.medications),
      formatDatedHistoryItems(medicalHistorySnapshot?.supplements),
    ]
      .filter((value): value is string => Boolean(value))
      .join('\n') || null;
  const medicationsText = input.medicationsText ?? medicationsAndSupplementsText;

  const model = input.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o';
  const userPrompt = buildClinicalUserPrompt({
    patientSnapshot,
    labSnapshot,
    medicalHistorySnapshot,
    medicationsText,
    localFoods,
    instructions: input.instructions,
  });

  const promptSnapshot = [
    '### SYSTEM',
    input.systemPrompt,
    '',
    '### USER',
    userPrompt,
  ].join('\n');

  const recommendation = await insertClinicalRecommendation({
    patientId,
    organizationId: patient.organizationId,
    labReportId: labReport.id,
    promptId: null,
    promptSnapshot,
    model,
    status: ClinicalRecommendationStatus.GENERATING,
    inputPatientSnapshot: patientSnapshot,
    inputLabSnapshot: labSnapshot,
    inputMedicalHistorySnapshot: medicalHistorySnapshot,
    inputMedicationsSnapshot: medicationsText,
    createdByUserId: ctx.userId,
  });

  await record(ctx, {
    action: AuditAction.CREATE,
    entityType: 'clinical_recommendation',
    entityId: recommendation.id,
    patientId,
    metadata: {
      labReportId: labReport.id,
      medicalHistoryId: input.medicalHistoryId,
    },
  });

  try {
    const generated = await generateRecommendationOutput({
      systemPrompt: input.systemPrompt,
      userPrompt,
      model,
    });

    const { model: usedModel, ...output } = generated;
    const updated = await updateClinicalRecommendation(patientId, recommendation.id, {
      status: ClinicalRecommendationStatus.PENDING_REVIEW,
      output,
      model: usedModel,
      generationError: null,
      generatedAt: new Date().toISOString(),
    });

    await record(ctx, {
      action: AuditAction.UPDATE,
      entityType: 'clinical_recommendation',
      entityId: recommendation.id,
      patientId,
      metadata: {
        step: 'generation',
        status: ClinicalRecommendationStatus.PENDING_REVIEW,
      },
    });

    return updated;
  } catch (error) {
    console.error('[recommendations] Failed to generate', {
      patientId,
      recommendationId: recommendation.id,
      error,
    });

    const failed = await updateClinicalRecommendation(patientId, recommendation.id, {
      status: ClinicalRecommendationStatus.FAILED,
      generationError: generationErrorMessage(error),
      generatedAt: new Date().toISOString(),
    });

    await record(ctx, {
      action: AuditAction.UPDATE,
      entityType: 'clinical_recommendation',
      entityId: recommendation.id,
      patientId,
      metadata: {
        step: 'generation',
        status: ClinicalRecommendationStatus.FAILED,
      },
    });

    return failed;
  }
}

export async function confirmClinicalRecommendation(
  ctx: ActorContext,
  patientId: string,
  recommendationId: string,
) {
  await assertRecommendationPatientAccess(ctx, patientId);
  const existing = await findClinicalRecommendationByPatientAndId(patientId, recommendationId);

  if (!existing) {
    return null;
  }

  if (existing.status === ClinicalRecommendationStatus.CONFIRMED) {
    throw new ClinicalRecommendationValidationError({
      _form: 'Esta recomendación ya fue confirmada y no se puede modificar.',
    });
  }

  if (existing.status !== ClinicalRecommendationStatus.PENDING_REVIEW) {
    throw new ClinicalRecommendationValidationError({
      _form: 'Solo puedes confirmar recomendaciones pendientes de revisión.',
    });
  }

  const confirmed = await confirmClinicalRecommendationRow(
    patientId,
    recommendationId,
    ctx.userId,
  );

  if (!confirmed) {
    throw new ClinicalRecommendationValidationError({
      _form: 'Esta recomendación ya fue confirmada y no se puede modificar.',
    });
  }

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'clinical_recommendation',
    entityId: recommendationId,
    patientId,
    metadata: {
      statusBefore: existing.status,
      statusAfter: ClinicalRecommendationStatus.CONFIRMED,
    },
  });

  return confirmed;
}

export async function unlockClinicalRecommendation(
  ctx: ActorContext,
  patientId: string,
  recommendationId: string,
) {
  await assertRecommendationPatientAccess(ctx, patientId);
  const existing = await findClinicalRecommendationByPatientAndId(patientId, recommendationId);

  if (!existing) {
    return null;
  }

  if (existing.status !== ClinicalRecommendationStatus.CONFIRMED) {
    throw new ClinicalRecommendationValidationError({
      _form: 'Solo puedes editar recomendaciones confirmadas desde este botón.',
    });
  }

  const unlocked = await unlockClinicalRecommendationRow(patientId, recommendationId);

  if (!unlocked) {
    throw new ClinicalRecommendationValidationError({
      _form: 'No se pudo reabrir la recomendación. Intenta de nuevo.',
    });
  }

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'clinical_recommendation',
    entityId: recommendationId,
    patientId,
    metadata: {
      statusBefore: existing.status,
      statusAfter: ClinicalRecommendationStatus.PENDING_REVIEW,
      step: 'unlock',
    },
  });

  return unlocked;
}

export async function updateClinicalRecommendationEdits(
  ctx: ActorContext,
  patientId: string,
  recommendationId: string,
  edits: RecommendationEditInput,
) {
  await assertRecommendationPatientAccess(ctx, patientId);
  const existing = await findClinicalRecommendationByPatientAndId(patientId, recommendationId);

  if (!existing) {
    return null;
  }

  if (existing.status !== ClinicalRecommendationStatus.PENDING_REVIEW) {
    throw new ClinicalRecommendationValidationError({
      _form: 'Solo puedes editar recomendaciones pendientes de revisión. Usa "Editar" primero.',
    });
  }

  const currentOutput = asRecommendationOutput(existing.output);
  if (!currentOutput) {
    throw new ClinicalRecommendationValidationError({
      _form: 'No se pudo leer el contenido actual de la recomendación.',
    });
  }

  const mergedOutput = { ...currentOutput, ...edits };
  const updated = await updateClinicalRecommendationOutput(
    patientId,
    recommendationId,
    mergedOutput,
  );

  if (!updated) {
    throw new ClinicalRecommendationValidationError({
      _form: 'No se pudieron guardar los cambios. Intenta de nuevo.',
    });
  }

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'clinical_recommendation',
    entityId: recommendationId,
    patientId,
    metadata: { step: 'manual_edit' },
  });

  return updated;
}

export async function updateClinicalRecommendationShareSectionsById(
  ctx: ActorContext,
  patientId: string,
  recommendationId: string,
  sections: string[],
) {
  await assertRecommendationPatientAccess(ctx, patientId);
  const updated = await updateClinicalRecommendationShareSections(
    patientId,
    recommendationId,
    sections,
  );

  if (!updated) {
    throw new Response('No encontrado', { status: 404 });
  }

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'clinical_recommendation',
    entityId: recommendationId,
    patientId,
    metadata: { step: 'share_sections', sections },
  });

  return updated;
}

export function validateRecommendationEditFormData(formData: FormData) {
  const result = parseRecommendationEditFormData(formData);

  if (!result.success) {
    throw new ClinicalRecommendationValidationError(zodFieldErrors(result.error));
  }

  return result.data;
}

export function parseShareSectionsSelection(formData: FormData) {
  return parseShareSectionsFormData(formData);
}

export function validateGenerateRecommendationFormData(formData: FormData) {
  const result = parseGenerateRecommendationFormData(formData);

  if (!result.success) {
    throw new ClinicalRecommendationValidationError(zodFieldErrors(result.error));
  }

  return result.data;
}

async function assertRecommendationPatientAccess(ctx: ActorContext, patientId: string) {
  assertProvider(ctx);
  const patient = await findPatientById(patientId);

  if (!patient) {
    throw new Response('No encontrado', { status: 404 });
  }

  assertPatientAccess(ctx, patient);
  return patient;
}

function buildPatientSnapshot(
  patient: {
    birthDate: string;
    sex: Sex | null;
    ethnicity: string | null;
    heightCm: string | null;
    weightKg: string | null;
    residencePlace: string;
  },
  residenceRegion: string | null,
): DeidentifiedPatientSnapshot {
  const ageYears = calculateAgeYears(patient.birthDate);
  const heightCm = patient.heightCm ? Number(patient.heightCm) : null;
  const weightKg = patient.weightKg ? Number(patient.weightKg) : null;
  const bmi =
    heightCm && weightKg && heightCm > 0
      ? Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10
      : null;

  return {
    ageYears,
    sex: patient.sex ? formatSex(patient.sex) : null,
    ethnicity: patient.ethnicity,
    heightCm: patient.heightCm,
    weightKg: patient.weightKg,
    bmi,
    residencePlace: patient.residencePlace,
    residenceRegion,
  };
}

function calculateAgeYears(birthDate: string) {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  return Math.max(age, 0);
}

function buildClinicalUserPrompt({
  patientSnapshot,
  labSnapshot,
  medicalHistorySnapshot,
  medicationsText,
  localFoods,
  instructions,
}: {
  patientSnapshot: DeidentifiedPatientSnapshot;
  labSnapshot: LabSnapshot;
  medicalHistorySnapshot: MedicalHistorySnapshot | null;
  medicationsText: string | null;
  localFoods: LocalFoodSnapshot[];
  instructions: string;
}) {
  const sections = [
    '## Datos clínicos del paciente (sin identificadores personales)',
    '',
    '### Demografía y antropometría',
    JSON.stringify(patientSnapshot, null, 2),
    '',
    '### Antecedentes clínicos',
    medicalHistorySnapshot
      ? JSON.stringify(medicalHistorySnapshot, null, 2)
      : 'No se registraron antecedentes para esta generación.',
    '',
    '### Medicación y suplementos actuales',
    medicationsText ?? 'Ninguna reportada',
    '',
    '### Alimentos locales recomendables (catálogo por ciudad/región)',
    localFoods.length > 0
      ? JSON.stringify(localFoods, null, 2)
      : 'Sin catálogo local: falta residenceRegion del paciente. Usa alimentos colombianos generales y márcalo en missingInformation.',
    '',
    '### Laboratorio base (panel confirmado)',
    `Fecha de toma: ${labSnapshot.collectedAt ?? 'No indicada'}`,
    `Laboratorio: ${labSnapshot.labName ?? 'No indicado'}`,
    `Panel: ${labSnapshot.panelName ?? 'No indicado'}`,
    'Analitos:',
    JSON.stringify(labSnapshot.analytes, null, 2),
    '',
    '---',
    '',
    instructions.trim(),
  ];

  return sections.join('\n');
}

function generationErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === 'OPENAI_API_KEY is not configured') {
    return 'La generación no está configurada. Agrega OPENAI_API_KEY y vuelve a intentarlo.';
  }

  return 'No se pudo generar la recomendación. Verifica los datos y vuelve a intentarlo.';
}
