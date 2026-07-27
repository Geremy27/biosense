import { AuditAction } from '~/db/models/enums';
import {
  findMedicalHistoriesByPatientId,
  findMedicalHistoryByPatientAndId,
  findPatientById,
  insertMedicalHistory,
  softDeleteMedicalHistory,
  updateMedicalHistory,
} from '~/db/repositories';
import {
  parseMedicalHistoryFormData,
  type MedicalHistoryInput,
} from '~/validation/medical-history';
import { zodFieldErrors } from '~/validation/zod-errors';

import { record } from './audit.service';
import { assertPatientAccess, assertProvider } from './authz';
import type { ActorContext } from './context';

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
    title: input.title,
    recordedAt: input.recordedAt,
    chiefComplaint: input.chiefComplaint,
    personalHistory: input.personalHistory,
    familyHistory: input.familyHistory,
    surgicalHistory: input.surgicalHistory,
    allergies: input.allergies,
    medicationsAndSupplements: input.medicationsAndSupplements,
    habitsLifestyle: input.habitsLifestyle,
    notes: input.notes,
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

export async function updateMedicalHistoryById(
  ctx: ActorContext,
  patientId: string,
  id: string,
  input: MedicalHistoryInput,
) {
  await assertMedicalHistoryPatientAccess(ctx, patientId);

  const row = await updateMedicalHistory(patientId, id, {
    title: input.title,
    recordedAt: input.recordedAt,
    chiefComplaint: input.chiefComplaint,
    personalHistory: input.personalHistory,
    familyHistory: input.familyHistory,
    surgicalHistory: input.surgicalHistory,
    allergies: input.allergies,
    medicationsAndSupplements: input.medicationsAndSupplements,
    habitsLifestyle: input.habitsLifestyle,
    notes: input.notes,
  });

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'patient_medical_history',
    entityId: id,
    patientId,
    metadata: { title: input.title },
  });

  return row;
}

export async function deleteMedicalHistoryById(ctx: ActorContext, patientId: string, id: string) {
  await assertMedicalHistoryPatientAccess(ctx, patientId);
  const row = await softDeleteMedicalHistory(patientId, id);

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

async function assertMedicalHistoryPatientAccess(ctx: ActorContext, patientId: string) {
  assertProvider(ctx);
  const patient = await findPatientById(patientId);

  if (!patient) {
    throw new Response('No encontrado', { status: 404 });
  }

  assertPatientAccess(ctx, patient);
  return patient;
}
