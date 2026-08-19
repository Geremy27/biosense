import { and, eq, isNull, ne } from 'drizzle-orm';

import { db } from '..';
import type { IdentificationType } from '../models/enums';
import { patients } from '../models/patients';

type PatientRow = typeof patients.$inferSelect;
type NewPatient = typeof patients.$inferInsert;

// Returns patients, optionally scoped to a provider or organization.
export async function findPatients(options?: {
  primaryProviderId?: string;
  organizationId?: string;
  includeDeleted?: boolean;
}) {
  const includeDeleted = options?.includeDeleted ?? false;
  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(patients.deletedAt));
  }

  if (options?.primaryProviderId) {
    conditions.push(eq(patients.primaryProviderId, options.primaryProviderId));
  }

  if (options?.organizationId) {
    conditions.push(eq(patients.organizationId, options.organizationId));
  }

  return db
    .select()
    .from(patients)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(patients.firstLastName, patients.firstName);
}

// Returns a patient by id, or null when not found.
export async function findPatientById(id: string, options?: { includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;

  const [row] = await db
    .select()
    .from(patients)
    .where(
      includeDeleted
        ? eq(patients.id, id)
        : and(eq(patients.id, id), isNull(patients.deletedAt)),
    )
    .limit(1);

  return row ?? null;
}

// Returns a patient by organization identification, or null when not found.
export async function findPatientByIdentification(
  organizationId: string,
  identificationType: IdentificationType,
  identificationNumber: string,
  options?: { excludeId?: string; includeDeleted?: boolean },
) {
  const includeDeleted = options?.includeDeleted ?? false;
  const conditions = [
    eq(patients.organizationId, organizationId),
    eq(patients.identificationType, identificationType),
    eq(patients.identificationNumber, identificationNumber),
  ];

  if (!includeDeleted) {
    conditions.push(isNull(patients.deletedAt));
  }

  if (options?.excludeId) {
    conditions.push(ne(patients.id, options.excludeId));
  }

  const [row] = await db
    .select()
    .from(patients)
    .where(and(...conditions))
    .limit(1);

  return row ?? null;
}

// Inserts a new patient and returns the created row.
export async function insertPatient(data: NewPatient): Promise<PatientRow> {
  const [row] = await db.insert(patients).values(data).returning();

  if (!row) {
    throw new Error('Failed to insert patient');
  }

  return row;
}

// Updates a patient by id and returns the updated row.
export async function updatePatient(
  id: string,
  data: Partial<
    Pick<
      PatientRow,
      | 'identificationType'
      | 'identificationNumber'
      | 'firstName'
      | 'secondName'
      | 'firstLastName'
      | 'secondLastName'
      | 'birthDate'
      | 'birthPlace'
      | 'residencePlace'
      | 'residenceRegionId'
      | 'phone'
      | 'email'
      | 'sex'
      | 'ethnicity'
      | 'heightCm'
      | 'weightKg'
    >
  >,
): Promise<PatientRow | null> {
  const [row] = await db
    .update(patients)
    .set(data)
    .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
    .returning();

  return row ?? null;
}

// Soft-deletes a patient by setting deletedAt.
export async function softDeletePatient(id: string): Promise<PatientRow | null> {
  const [row] = await db
    .update(patients)
    .set({ deletedAt: new Date().toISOString() })
    .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
    .returning();

  return row ?? null;
}
