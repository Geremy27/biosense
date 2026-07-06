import { AuditAction } from '~/db/models/enums';
import { findProviderById } from '~/db/repositories/providers.repository';
import {
  findPatientById,
  findPatientByIdentification,
  findPatients,
  insertPatient,
  softDeletePatient,
  updatePatient,
} from '~/db/repositories/patients.repository';
import { parsePatientFormData, type PatientInput } from '~/validation/patients';
import { zodFieldErrors } from '~/validation/zod-errors';

import { record } from './audit.service';
import { assertPatientAccess, assertProvider } from './authz';
import type { ActorContext } from './context';

export class PatientValidationError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super('Validation failed');
    this.name = 'PatientValidationError';
    this.fieldErrors = fieldErrors;
  }
}

// Lists patients owned by the current provider.
export async function listPatients(ctx: ActorContext) {
  assertProvider(ctx);

  const rows = await findPatients({ primaryProviderId: ctx.providerId });

  await record(ctx, {
    action: AuditAction.LIST,
    entityType: 'patient',
    metadata: { count: rows.length },
  });

  return rows;
}

// Returns a patient by id when the actor has access.
export async function getPatient(ctx: ActorContext, id: string) {
  const row = await findPatientById(id);

  if (row) {
    assertPatientAccess(ctx, row);
  }

  await record(ctx, {
    action: AuditAction.VIEW,
    entityType: 'patient',
    entityId: id,
    patientId: id,
    metadata: { found: row !== null },
  });

  return row;
}

// Creates a patient assigned to the current provider.
export async function createPatient(ctx: ActorContext, input: PatientInput) {
  assertProvider(ctx);

  const provider = await findProviderById(ctx.providerId);
  if (!provider) {
    throw new PatientValidationError({ _form: 'Perfil de prestador no encontrado.' });
  }

  await assertIdentificationAvailable(
    provider.organizationId,
    input.identificationType,
    input.identificationNumber,
  );

  const row = await insertPatient({
    organizationId: provider.organizationId,
    primaryProviderId: ctx.providerId,
    ...toPatientValues(input),
  });

  await record(ctx, {
    action: AuditAction.CREATE,
    entityType: 'patient',
    entityId: row.id,
    patientId: row.id,
    metadata: {
      identificationType: row.identificationType,
      identificationNumber: row.identificationNumber,
    },
  });

  return row;
}

// Updates a patient when the actor has access.
export async function updatePatientById(ctx: ActorContext, id: string, input: PatientInput) {
  const existing = await findPatientById(id);
  if (!existing) {
    return null;
  }

  assertPatientAccess(ctx, existing);

  await assertIdentificationAvailable(
    existing.organizationId,
    input.identificationType,
    input.identificationNumber,
    id,
  );

  const row = await updatePatient(id, toPatientValues(input));

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'patient',
    entityId: id,
    patientId: id,
    metadata: {
      before: {
        identificationType: existing.identificationType,
        identificationNumber: existing.identificationNumber,
      },
      after: row
        ? {
            identificationType: row.identificationType,
            identificationNumber: row.identificationNumber,
          }
        : null,
    },
  });

  return row;
}

// Soft-deletes a patient when the actor has access.
export async function deletePatient(ctx: ActorContext, id: string) {
  const existing = await findPatientById(id);
  if (!existing) {
    return null;
  }

  assertPatientAccess(ctx, existing);

  const row = await softDeletePatient(id);

  await record(ctx, {
    action: AuditAction.DELETE,
    entityType: 'patient',
    entityId: id,
    patientId: id,
    metadata: {
      before: {
        identificationType: existing.identificationType,
        identificationNumber: existing.identificationNumber,
      },
    },
  });

  return row;
}

// Parses and validates patient form data, throwing PatientValidationError on failure.
export function validatePatientFormData(formData: FormData): PatientInput {
  const result = parsePatientFormData(formData);

  if (!result.success) {
    throw new PatientValidationError(zodFieldErrors(result.error));
  }

  return result.data;
}

// Maps validated patient input into database column values.
function toPatientValues(input: PatientInput) {
  return {
    identificationType: input.identificationType,
    identificationNumber: input.identificationNumber,
    firstName: input.firstName,
    secondName: input.secondName,
    firstLastName: input.firstLastName,
    secondLastName: input.secondLastName,
    birthDate: input.birthDate,
    birthPlace: input.birthPlace,
    residencePlace: input.residencePlace,
    phone: input.phone,
    email: input.email,
    sex: input.sex,
    ethnicity: input.ethnicity,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
  };
}

// Ensures identification is unique within the patient's organization.
async function assertIdentificationAvailable(
  organizationId: string,
  identificationType: PatientInput['identificationType'],
  identificationNumber: string,
  excludeId?: string,
) {
  const duplicate = await findPatientByIdentification(
    organizationId,
    identificationType,
    identificationNumber,
    { excludeId },
  );

  if (duplicate) {
    throw new PatientValidationError({
      identificationNumber: 'Ya existe un paciente con esta identificación en la organización.',
    });
  }
}
