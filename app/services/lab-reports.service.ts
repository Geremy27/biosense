import { AuditAction, LabReportStatus } from '~/db/models/enums';
import {
  confirmLabReportWithAnalytes,
  findLabAnalytesByReportId,
  findLabReportByPatientAndId,
  findLabReportsByPatientId,
  findPatientById,
  insertLabReport,
  replaceLabAnalytes,
  updateLabReport,
} from '~/db/repositories';
import {
  parseConfirmLabReportFormData,
  type ConfirmLabReportInput,
} from '~/validation/lab-reports';
import { zodFieldErrors } from '~/validation/zod-errors';

import { record } from './audit.service';
import { assertPatientAccess, assertProvider } from './authz';
import type { ActorContext } from './context';
import { extractLabFromPdf } from './lab-extraction.service';

const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export class LabReportValidationError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super('Validation failed');
    this.name = 'LabReportValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export async function listLabReports(ctx: ActorContext, patientId: string) {
  await assertLabPatientAccess(ctx, patientId);
  const rows = await findLabReportsByPatientId(patientId);

  await record(ctx, {
    action: AuditAction.LIST,
    entityType: 'lab_report',
    patientId,
    metadata: { count: rows.length },
  });

  return rows;
}

export async function getLabReport(ctx: ActorContext, patientId: string, reportId: string) {
  await assertLabPatientAccess(ctx, patientId);
  const report = await findLabReportByPatientAndId(patientId, reportId);
  const analytes = report ? await findLabAnalytesByReportId(report.id) : [];

  await record(ctx, {
    action: AuditAction.VIEW,
    entityType: 'lab_report',
    entityId: reportId,
    patientId,
    metadata: { found: report !== null },
  });

  return report ? { report, analytes } : null;
}

export async function uploadAndExtractLabReport(
  ctx: ActorContext,
  patientId: string,
  value: FormDataEntryValue | null,
) {
  assertProvider(ctx);
  const patient = await assertLabPatientAccess(ctx, patientId);
  const file = validatePdf(value);
  const bytes = Buffer.from(await file.arrayBuffer());
  assertPdfSignature(bytes);

  const reportId = crypto.randomUUID();
  const report = await insertLabReport({
    id: reportId,
    patientId,
    organizationId: patient.organizationId,
    uploadedByProviderId: ctx.providerId,
    originalFilename: file.name || 'laboratorio.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: file.size,
    status: LabReportStatus.EXTRACTING,
  });

  await record(ctx, {
    action: AuditAction.CREATE,
    entityType: 'lab_report',
    entityId: report.id,
    patientId,
    metadata: {
      filename: report.originalFilename,
      fileSizeBytes: report.fileSizeBytes,
    },
  });

  return extractUploadedLabReport(ctx, patientId, report.id, bytes, report.originalFilename);
}

export async function confirmLabReport(
  ctx: ActorContext,
  patientId: string,
  reportId: string,
  input: ConfirmLabReportInput,
) {
  await assertLabPatientAccess(ctx, patientId);
  const existing = await findLabReportByPatientAndId(patientId, reportId);

  if (!existing) {
    return null;
  }

  if (existing.status === LabReportStatus.CONFIRMED) {
    throw immutableReportError();
  }

  if (existing.status !== LabReportStatus.PENDING_REVIEW) {
    throw new LabReportValidationError({
      _form: 'El informe debe terminar su extracción antes de confirmarlo.',
    });
  }

  const confirmed = await confirmLabReportWithAnalytes(
    patientId,
    reportId,
    {
      labName: input.labName,
      panelName: input.panelName,
      collectedAt: input.collectedAt,
      confirmedAt: new Date().toISOString(),
      confirmedByUserId: ctx.userId,
    },
    input.analytes.map((analyte, sortOrder) => ({
      patientId,
      sortOrder,
      ...analyte,
    })),
  );

  if (!confirmed) {
    throw immutableReportError();
  }

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'lab_report',
    entityId: reportId,
    patientId,
    metadata: {
      statusBefore: existing.status,
      statusAfter: LabReportStatus.CONFIRMED,
      analyteCount: input.analytes.length,
    },
  });

  return confirmed.report;
}

export function validateConfirmLabReportFormData(formData: FormData) {
  const result = parseConfirmLabReportFormData(formData);

  if (!result.success) {
    throw new LabReportValidationError(zodFieldErrors(result.error));
  }

  return result.data;
}

async function extractUploadedLabReport(
  ctx: ActorContext,
  patientId: string,
  reportId: string,
  pdf: Buffer,
  filename: string,
) {
  const report = await findLabReportByPatientAndId(patientId, reportId);
  if (!report) {
    return null;
  }

  try {
    const extracted = await extractLabFromPdf(pdf, filename);

    if (!extracted.isBloodwork) {
      const failed = await updateLabReport(patientId, reportId, {
        status: LabReportStatus.FAILED,
        extractionModel: extracted.model,
        extractionError:
          extracted.classificationReason ?? 'El archivo no parece ser un examen de sangre.',
        extractedAt: new Date().toISOString(),
      });

      await recordExtraction(ctx, patientId, reportId, failed?.status, 0);
      return failed;
    }

    if (extracted.analytes.length === 0) {
      throw new Error('No se encontraron resultados en el informe.');
    }

    await replaceLabAnalytes(
      reportId,
      extracted.analytes.map((analyte, sortOrder) => ({
        patientId,
        sortOrder,
        ...analyte,
      })),
    );

    const updated = await updateLabReport(patientId, reportId, {
      status: LabReportStatus.PENDING_REVIEW,
      labName: extracted.labName,
      panelName: extracted.panelName,
      collectedAt: normalizeExtractedDate(extracted.collectedAt),
      extractionModel: extracted.model,
      extractionError: null,
      extractedAt: new Date().toISOString(),
    });

    await recordExtraction(
      ctx,
      patientId,
      reportId,
      updated?.status,
      extracted.analytes.length,
    );
    return updated;
  } catch (error) {
    console.error('[labs] Failed to extract report', { patientId, reportId, error });
    const failed = await updateLabReport(patientId, reportId, {
      status: LabReportStatus.FAILED,
      extractionError: extractionErrorMessage(error),
      extractedAt: new Date().toISOString(),
    });

    await recordExtraction(ctx, patientId, reportId, failed?.status, 0);
    return failed;
  }
}

async function assertLabPatientAccess(ctx: ActorContext, patientId: string) {
  assertProvider(ctx);
  const patient = await findPatientById(patientId);

  if (!patient) {
    throw new Response('No encontrado', { status: 404 });
  }

  assertPatientAccess(ctx, patient);
  return patient;
}

function validatePdf(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    throw new LabReportValidationError({ pdf: 'Selecciona un archivo PDF.' });
  }

  if (
    value.type &&
    value.type !== 'application/pdf' &&
    value.type !== 'application/octet-stream'
  ) {
    throw new LabReportValidationError({ pdf: 'El archivo debe ser un PDF.' });
  }

  const configuredMax = Number(process.env.LAB_MAX_UPLOAD_BYTES);
  const maxBytes =
    Number.isFinite(configuredMax) && configuredMax > 0 ? configuredMax : DEFAULT_MAX_UPLOAD_BYTES;

  if (value.size > maxBytes) {
    throw new LabReportValidationError({
      pdf: `El PDF no puede superar ${Math.floor(maxBytes / 1024 / 1024)} MB.`,
    });
  }

  return value;
}

function assertPdfSignature(bytes: Buffer) {
  if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new LabReportValidationError({ pdf: 'El archivo no contiene un PDF válido.' });
  }
}

function immutableReportError() {
  return new LabReportValidationError({
    _form: 'Este informe ya fue confirmado y no se puede modificar.',
  });
}

function normalizeExtractedDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function extractionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === 'OPENAI_API_KEY is not configured') {
    return 'La extracción no está configurada. Agrega OPENAI_API_KEY y vuelve a intentarlo.';
  }

  if (error instanceof Error && error.message.startsWith('No se encontraron')) {
    return error.message;
  }

  return 'No se pudo extraer el informe. Verifica el PDF y vuelve a intentarlo.';
}

async function recordExtraction(
  ctx: ActorContext,
  patientId: string,
  reportId: string,
  status: LabReportStatus | undefined,
  analyteCount: number,
) {
  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'lab_report',
    entityId: reportId,
    patientId,
    metadata: { step: 'extraction', status, analyteCount },
  });
}
