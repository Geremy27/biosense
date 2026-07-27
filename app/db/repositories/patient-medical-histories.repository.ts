import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '..';
import { patientMedicalHistories } from '../models/patient-medical-histories';

type PatientMedicalHistoryRow = typeof patientMedicalHistories.$inferSelect;
type NewPatientMedicalHistory = typeof patientMedicalHistories.$inferInsert;

export async function findMedicalHistoriesByPatientId(patientId: string) {
  return db
    .select()
    .from(patientMedicalHistories)
    .where(
      and(
        eq(patientMedicalHistories.patientId, patientId),
        isNull(patientMedicalHistories.deletedAt),
      ),
    )
    .orderBy(desc(patientMedicalHistories.recordedAt), desc(patientMedicalHistories.createdAt));
}

export async function findMedicalHistoryByPatientAndId(patientId: string, id: string) {
  const [row] = await db
    .select()
    .from(patientMedicalHistories)
    .where(
      and(
        eq(patientMedicalHistories.id, id),
        eq(patientMedicalHistories.patientId, patientId),
        isNull(patientMedicalHistories.deletedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function insertMedicalHistory(
  data: NewPatientMedicalHistory,
): Promise<PatientMedicalHistoryRow> {
  const [row] = await db.insert(patientMedicalHistories).values(data).returning();

  if (!row) {
    throw new Error('Failed to insert patient medical history');
  }

  return row;
}

export async function updateMedicalHistory(
  patientId: string,
  id: string,
  data: Partial<
    Pick<
      PatientMedicalHistoryRow,
      | 'title'
      | 'recordedAt'
      | 'chiefComplaint'
      | 'personalHistory'
      | 'familyHistory'
      | 'surgicalHistory'
      | 'allergies'
      | 'medicationsAndSupplements'
      | 'habitsLifestyle'
      | 'notes'
    >
  >,
): Promise<PatientMedicalHistoryRow | null> {
  const [row] = await db
    .update(patientMedicalHistories)
    .set(data)
    .where(
      and(
        eq(patientMedicalHistories.id, id),
        eq(patientMedicalHistories.patientId, patientId),
        isNull(patientMedicalHistories.deletedAt),
      ),
    )
    .returning();

  return row ?? null;
}

export async function softDeleteMedicalHistory(
  patientId: string,
  id: string,
): Promise<PatientMedicalHistoryRow | null> {
  const [row] = await db
    .update(patientMedicalHistories)
    .set({ deletedAt: new Date().toISOString() })
    .where(
      and(
        eq(patientMedicalHistories.id, id),
        eq(patientMedicalHistories.patientId, patientId),
        isNull(patientMedicalHistories.deletedAt),
      ),
    )
    .returning();

  return row ?? null;
}
