import { AuditAction, ClinicalRecommendationStatus, LabReportStatus, Sex } from '~/db/models/enums';
import {
  confirmClinicalRecommendationRow,
  findClinicalRecommendationByPatientAndId,
  findClinicalRecommendationsByPatientId,
  findLabAnalytesByReportId,
  findLabReportByPatientAndId,
  findMedicalHistoryByPatientAndId,
  findPatientById,
  insertClinicalRecommendation,
  updateClinicalRecommendation,
} from '~/db/repositories';
import { formatSex } from '~/utils/patient-display';
import {
  parseGenerateRecommendationFormData,
  type GenerateRecommendationInput,
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
  personalHistory: string | null;
  familyHistory: string | null;
  surgicalHistory: string | null;
  allergies: string | null;
  medicationsAndSupplements: string | null;
  habitsLifestyle: string | null;
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
      personalHistory: medicalHistory.personalHistory,
      familyHistory: medicalHistory.familyHistory,
      surgicalHistory: medicalHistory.surgicalHistory,
      allergies: medicalHistory.allergies,
      medicationsAndSupplements: medicalHistory.medicationsAndSupplements,
      habitsLifestyle: medicalHistory.habitsLifestyle,
      notes: medicalHistory.notes,
    };
  }

  const patientSnapshot = buildPatientSnapshot(patient);
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

  const medicationsText =
    input.medicationsText ??
    medicalHistorySnapshot?.medicationsAndSupplements ??
    null;

  const model = input.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o';
  const userPrompt = buildClinicalUserPrompt({
    patientSnapshot,
    labSnapshot,
    medicalHistorySnapshot,
    medicationsText,
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

function buildPatientSnapshot(patient: {
  birthDate: string;
  sex: Sex | null;
  ethnicity: string | null;
  heightCm: string | null;
  weightKg: string | null;
}): DeidentifiedPatientSnapshot {
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
  instructions,
}: {
  patientSnapshot: DeidentifiedPatientSnapshot;
  labSnapshot: LabSnapshot;
  medicalHistorySnapshot: MedicalHistorySnapshot | null;
  medicationsText: string | null;
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
