import { and, desc, eq, isNull, ne } from 'drizzle-orm';

import { db } from '..';
import { MedicalHistoryStatus } from '../models/enums';
import { patientMedicalHistories } from '../models/patient-medical-histories';

type PatientMedicalHistoryRow = typeof patientMedicalHistories.$inferSelect;
type NewPatientMedicalHistory = typeof patientMedicalHistories.$inferInsert;

const EDITABLE_FIELDS = [
  'title',
  'recordedAt',
  'chiefComplaint',
  'personalHistory1',
  'personalHistory2',
  'surgicalHistory',
  'medications',
  'supplements',
  'infectiousHistory',
  'traumaticHistory',
  'toxicologicalHistory',
  'allergies',
  'vaccines',
  'habits',
  'gynecoObstetricHistory',
  'familyHistory',
  'psychosocialHistory',
  'notes',
] as const;

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
  data: Partial<Pick<PatientMedicalHistoryRow, (typeof EDITABLE_FIELDS)[number]>>,
): Promise<PatientMedicalHistoryRow | null> {
  const [row] = await db
    .update(patientMedicalHistories)
    .set(data)
    .where(
      and(
        eq(patientMedicalHistories.id, id),
        eq(patientMedicalHistories.patientId, patientId),
        eq(patientMedicalHistories.status, MedicalHistoryStatus.DRAFT),
        isNull(patientMedicalHistories.deletedAt),
      ),
    )
    .returning();

  return row ?? null;
}

// Unlike updateMedicalHistory, this is not restricted to DRAFT records: it is
// used internally to move a PDF-extracted record between EXTRACTING, DRAFT and
// FAILED before a doctor has had a chance to review anything.
export async function updateMedicalHistoryExtractionState(
  patientId: string,
  id: string,
  data: Partial<
    Pick<
      PatientMedicalHistoryRow,
      | 'status'
      | 'title'
      | 'recordedAt'
      | 'chiefComplaint'
      | 'personalHistory1'
      | 'personalHistory2'
      | 'surgicalHistory'
      | 'medications'
      | 'supplements'
      | 'infectiousHistory'
      | 'traumaticHistory'
      | 'toxicologicalHistory'
      | 'allergies'
      | 'vaccines'
      | 'habits'
      | 'gynecoObstetricHistory'
      | 'familyHistory'
      | 'psychosocialHistory'
      | 'notes'
      | 'extractionModel'
      | 'extractionError'
      | 'extractedAt'
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

export async function confirmMedicalHistory(
  patientId: string,
  id: string,
  data: Pick<PatientMedicalHistoryRow, 'confirmedAt' | 'confirmedByUserId'>,
): Promise<PatientMedicalHistoryRow | null> {
  const [row] = await db
    .update(patientMedicalHistories)
    .set({ ...data, status: MedicalHistoryStatus.CONFIRMED })
    .where(
      and(
        eq(patientMedicalHistories.id, id),
        eq(patientMedicalHistories.patientId, patientId),
        eq(patientMedicalHistories.status, MedicalHistoryStatus.DRAFT),
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
        ne(patientMedicalHistories.status, MedicalHistoryStatus.CONFIRMED),
        isNull(patientMedicalHistories.deletedAt),
      ),
    )
    .returning();

  return row ?? null;
}
