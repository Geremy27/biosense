import { AuditAction, MedicalHistoryStatus } from '~/db/models/enums';
import {
  confirmMedicalHistory as confirmMedicalHistoryRow,
  findLatestMedicalHistoryForPrefill,
  findMedicalHistoriesByPatientId,
  findMedicalHistoryByPatientAndId,
  findPatientById,
  insertMedicalHistory,
  softDeleteMedicalHistory,
  updateMedicalHistory,
  updateMedicalHistoryExtractionState,
} from '~/db/repositories';
import {
  clinicalDefaultsFromHistory,
  emptyMedicalHistoryClinicalDefaults,
  mergeClinicalHistoryFromPrevious,
  parseConfirmMedicalHistoryFormData,
  parseMedicalHistoryFormData,
  type DatedHistoryItem,
  type MedicalHistoryInput,
} from '~/validation/medical-history';
import { zodFieldErrors } from '~/validation/zod-errors';
import { PdfUploadError, readPdfBytes, validatePdfUpload } from '~/utils/pdf-upload.server';

import { record } from './audit.service';
import { assertPatientAccess, assertProvider } from './authz';
import type { ActorContext } from './context';
import { extractMedicalHistoryFromPdf } from './medical-history-extraction.service';

export class MedicalHistoryValidationError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super('Validation failed');
    this.name = 'MedicalHistoryValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export async function listMedicalHistories(ctx: ActorContext, patientId: string) {
  await assertMedicalHistoryPatientAccess(ctx, patientId);
  const rows = await findMedicalHistoriesByPatientId(patientId);

  await record(ctx, {
    action: AuditAction.LIST,
    entityType: 'patient_medical_history',
    patientId,
    metadata: { count: rows.length },
  });

  return rows;
}

export async function getMedicalHistoryPrefillDefaults(ctx: ActorContext, patientId: string) {
  await assertMedicalHistoryPatientAccess(ctx, patientId);
  const previous = await findLatestMedicalHistoryForPrefill(patientId);
  const today = new Date().toISOString().slice(0, 10);

  if (!previous) {
    return {
      ...emptyMedicalHistoryClinicalDefaults(),
      title: '',
      recordedAt: today,
      prefilledFromId: null as string | null,
    };
  }

  return {
    ...clinicalDefaultsFromHistory(previous),
    title: '',
    recordedAt: today,
    prefilledFromId: previous.id as string | null,
  };
}

export async function getMedicalHistory(ctx: ActorContext, patientId: string, id: string) {
  await assertMedicalHistoryPatientAccess(ctx, patientId);
  const row = await findMedicalHistoryByPatientAndId(patientId, id);

  await record(ctx, {
    action: AuditAction.VIEW,
    entityType: 'patient_medical_history',
    entityId: id,
    patientId,
    metadata: { found: row !== null },
  });

  return row;
}

export async function createMedicalHistory(
  ctx: ActorContext,
  patientId: string,
  input: MedicalHistoryInput,
) {
  assertProvider(ctx);
  const patient = await assertMedicalHistoryPatientAccess(ctx, patientId);

  const row = await insertMedicalHistory({
    patientId,
    organizationId: patient.organizationId,
    ...input,
    createdByUserId: ctx.userId,
  });

  await record(ctx, {
    action: AuditAction.CREATE,
    entityType: 'patient_medical_history',
    entityId: row.id,
    patientId,
    metadata: { title: row.title },
  });

  return row;
}

export async function uploadAndExtractMedicalHistory(
  ctx: ActorContext,
  patientId: string,
  value: FormDataEntryValue | null,
) {
  assertProvider(ctx);
  const patient = await assertMedicalHistoryPatientAccess(ctx, patientId);

  let file: File;
  let bytes: Buffer;
  try {
    file = validatePdfUpload(value, 'MEDICAL_HISTORY_MAX_UPLOAD_BYTES');
    bytes = await readPdfBytes(file);
  } catch (error) {
    if (error instanceof PdfUploadError) {
      throw new MedicalHistoryValidationError({ pdf: error.message });
    }

    throw error;
  }

  const row = await insertMedicalHistory({
    patientId,
    organizationId: patient.organizationId,
    title: 'Extrayendo antecedentes…',
    recordedAt: new Date().toISOString().slice(0, 10),
    status: MedicalHistoryStatus.EXTRACTING,
    originalFilename: file.name || 'antecedentes.pdf',
    createdByUserId: ctx.userId,
  });

  await record(ctx, {
    action: AuditAction.CREATE,
    entityType: 'patient_medical_history',
    entityId: row.id,
    patientId,
    metadata: { filename: row.originalFilename, source: 'pdf_extraction' },
  });

  return extractUploadedMedicalHistory(ctx, patientId, row.id, bytes, row.originalFilename ?? 'antecedentes.pdf');
}

async function extractUploadedMedicalHistory(
  ctx: ActorContext,
  patientId: string,
  id: string,
  pdf: Buffer,
  filename: string,
) {
  try {
    const extracted = await extractMedicalHistoryFromPdf(pdf, filename);

    if (!extracted.isClinicalDocument) {
      const failed = await updateMedicalHistoryExtractionState(patientId, id, {
        status: MedicalHistoryStatus.FAILED,
        extractionModel: extracted.model,
        extractionError:
          extracted.classificationReason ??
          'El archivo no parece ser un documento de historia clínica.',
        extractedAt: new Date().toISOString(),
      });

      await recordExtraction(ctx, patientId, id, failed?.status, false);
      return failed;
    }

    const recordedAt = normalizeExtractedDate(extracted.recordedAt);
    const previous = await findLatestMedicalHistoryForPrefill(patientId);
    const merged = mergeClinicalHistoryFromPrevious(
      {
        chiefComplaint: extracted.chiefComplaint,
        personalHistory1: normalizeExtractedDatedItems(extracted.personalHistory1, recordedAt),
        personalHistory2: normalizeExtractedDatedItems(extracted.personalHistory2, recordedAt),
        surgicalHistory: normalizeExtractedDatedItems(extracted.surgicalHistory, recordedAt),
        medications: normalizeExtractedDatedItems(extracted.medications, recordedAt),
        supplements: normalizeExtractedDatedItems(extracted.supplements, recordedAt),
        diet: normalizeExtractedDatedItems(extracted.diet, recordedAt),
        infectiousHistory: extracted.infectiousHistory,
        traumaticHistory: extracted.traumaticHistory,
        toxicologicalHistory: normalizeExtractedDatedItems(
          extracted.toxicologicalHistory,
          recordedAt,
        ),
        allergies: extracted.allergies,
        vaccines: extracted.vaccines,
        habits: extracted.habits,
        gynecoObstetricHistory: extracted.gynecoObstetricHistory,
        familyHistory: extracted.familyHistory,
        psychosocialHistory: extracted.psychosocialHistory,
        notes: extracted.notes,
      },
      previous,
    );
    const updated = await updateMedicalHistoryExtractionState(patientId, id, {
      status: MedicalHistoryStatus.DRAFT,
      title: extracted.title || 'Antecedentes extraídos de PDF',
      recordedAt,
      ...merged,
      extractionModel: extracted.model,
      extractionError: null,
      extractedAt: new Date().toISOString(),
    });

    await recordExtraction(ctx, patientId, id, updated?.status, true);
    return updated;
  } catch (error) {
    console.error('[medical-histories] Failed to extract record', { patientId, id, error });
    const failed = await updateMedicalHistoryExtractionState(patientId, id, {
      status: MedicalHistoryStatus.FAILED,
      extractionError: extractionErrorMessage(error),
      extractedAt: new Date().toISOString(),
    });

    await recordExtraction(ctx, patientId, id, failed?.status, false);
    return failed;
  }
}

function normalizeExtractedDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 10);
}

function normalizeExtractedDatedItems(
  items:
    | {
        label: string;
        detail: string | null;
        from: string | null;
        to: string | null;
      }[]
    | null
    | undefined,
  fallbackFrom: string,
): DatedHistoryItem[] {
  if (!items || items.length === 0) {
    return [];
  }

  return items
    .filter((item) => item.label.trim() !== '')
    .map((item) => ({
      label: item.label.trim(),
      detail: item.detail?.trim() ? item.detail.trim() : null,
      from:
        item.from && /^\d{4}-\d{2}-\d{2}$/.test(item.from) ? item.from : fallbackFrom,
      to: item.to && /^\d{4}-\d{2}-\d{2}$/.test(item.to) ? item.to : null,
    }));
}

function extractionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === 'OPENAI_API_KEY is not configured') {
    return 'La extracción no está configurada. Agrega OPENAI_API_KEY y vuelve a intentarlo.';
  }

  return 'No se pudo extraer el antecedente. Verifica el PDF y vuelve a intentarlo.';
}

async function recordExtraction(
  ctx: ActorContext,
  patientId: string,
  id: string,
  status: MedicalHistoryStatus | undefined,
  succeeded: boolean,
) {
  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'patient_medical_history',
    entityId: id,
    patientId,
    metadata: { step: 'extraction', status, succeeded },
  });
}

export async function updateMedicalHistoryById(
  ctx: ActorContext,
  patientId: string,
  id: string,
  input: MedicalHistoryInput,
) {
  await assertMedicalHistoryPatientAccess(ctx, patientId);
  await assertMedicalHistoryDraft(patientId, id);

  const row = await updateMedicalHistory(patientId, id, input);

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'patient_medical_history',
    entityId: id,
    patientId,
    metadata: { title: input.title },
  });

  return row;
}

export async function confirmMedicalHistoryById(ctx: ActorContext, patientId: string, id: string) {
  await assertMedicalHistoryPatientAccess(ctx, patientId);
  const existing = await assertMedicalHistoryDraft(patientId, id);

  const confirmed = await confirmMedicalHistoryRow(patientId, id, {
    confirmedAt: new Date().toISOString(),
    confirmedByUserId: ctx.userId,
  });

  if (!confirmed) {
    throw immutableHistoryError();
  }

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'patient_medical_history',
    entityId: id,
    patientId,
    metadata: {
      statusBefore: existing.status,
      statusAfter: MedicalHistoryStatus.CONFIRMED,
    },
  });

  return confirmed;
}

export async function deleteMedicalHistoryById(ctx: ActorContext, patientId: string, id: string) {
  await assertMedicalHistoryPatientAccess(ctx, patientId);
  await assertMedicalHistoryDeletable(patientId, id);

  const row = await softDeleteMedicalHistory(patientId, id);

  if (!row) {
    throw immutableHistoryError();
  }

  await record(ctx, {
    action: AuditAction.DELETE,
    entityType: 'patient_medical_history',
    entityId: id,
    patientId,
    metadata: { soft: true },
  });

  return row;
}

export function validateMedicalHistoryFormData(formData: FormData) {
  const result = parseMedicalHistoryFormData(formData);

  if (!result.success) {
    throw new MedicalHistoryValidationError(zodFieldErrors(result.error));
  }

  return result.data;
}

export function validateConfirmMedicalHistoryFormData(formData: FormData) {
  const result = parseConfirmMedicalHistoryFormData(formData);

  if (!result.success) {
    throw new MedicalHistoryValidationError(zodFieldErrors(result.error));
  }

  return result.data;
}

async function assertMedicalHistoryPatientAccess(ctx: ActorContext, patientId: string) {
  assertProvider(ctx);
  const patient = await findPatientById(patientId);

  if (!patient) {
    throw new Response('No encontrado', { status: 404 });
  }

  assertPatientAccess(ctx, patient);
  return patient;
}

async function assertMedicalHistoryDraft(patientId: string, id: string) {
  const existing = await findMedicalHistoryByPatientAndId(patientId, id);

  if (!existing) {
    throw new Response('No encontrado', { status: 404 });
  }

  if (existing.status === MedicalHistoryStatus.CONFIRMED) {
    throw immutableHistoryError();
  }

  if (existing.status !== MedicalHistoryStatus.DRAFT) {
    throw new MedicalHistoryValidationError({
      _form: 'Este registro todavía no está listo para editarse o confirmarse.',
    });
  }

  return existing;
}

async function assertMedicalHistoryDeletable(patientId: string, id: string) {
  const existing = await findMedicalHistoryByPatientAndId(patientId, id);

  if (!existing) {
    throw new Response('No encontrado', { status: 404 });
  }

  if (existing.status === MedicalHistoryStatus.CONFIRMED) {
    throw immutableHistoryError();
  }

  return existing;
}

function immutableHistoryError() {
  return new MedicalHistoryValidationError({
    _form: 'Este antecedente ya fue confirmado y por ley no se puede modificar ni eliminar.',
  });
}
