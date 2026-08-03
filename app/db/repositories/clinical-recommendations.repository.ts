import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '..';
import { ClinicalRecommendationStatus } from '../models/enums';
import { clinicalRecommendations } from '../models/clinical-recommendations';

type ClinicalRecommendationRow = typeof clinicalRecommendations.$inferSelect;
type NewClinicalRecommendation = typeof clinicalRecommendations.$inferInsert;

export async function findClinicalRecommendationsByPatientId(patientId: string) {
  return db
    .select()
    .from(clinicalRecommendations)
    .where(
      and(
        eq(clinicalRecommendations.patientId, patientId),
        isNull(clinicalRecommendations.deletedAt),
      ),
    )
    .orderBy(desc(clinicalRecommendations.createdAt));
}

export async function findClinicalRecommendationByPatientAndId(patientId: string, id: string) {
  const [row] = await db
    .select()
    .from(clinicalRecommendations)
    .where(
      and(
        eq(clinicalRecommendations.id, id),
        eq(clinicalRecommendations.patientId, patientId),
        isNull(clinicalRecommendations.deletedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function insertClinicalRecommendation(
  data: NewClinicalRecommendation,
): Promise<ClinicalRecommendationRow> {
  const [row] = await db.insert(clinicalRecommendations).values(data).returning();

  if (!row) {
    throw new Error('Failed to insert clinical recommendation');
  }

  return row;
}

export async function updateClinicalRecommendation(
  patientId: string,
  id: string,
  data: Partial<
    Pick<
      ClinicalRecommendationRow,
      | 'status'
      | 'output'
      | 'model'
      | 'generationError'
      | 'generatedAt'
      | 'confirmedAt'
      | 'confirmedByUserId'
    >
  >,
): Promise<ClinicalRecommendationRow | null> {
  const [row] = await db
    .update(clinicalRecommendations)
    .set(data)
    .where(
      and(
        eq(clinicalRecommendations.id, id),
        eq(clinicalRecommendations.patientId, patientId),
        isNull(clinicalRecommendations.deletedAt),
      ),
    )
    .returning();

  return row ?? null;
}

export async function confirmClinicalRecommendationRow(
  patientId: string,
  id: string,
  confirmedByUserId: string | null,
): Promise<ClinicalRecommendationRow | null> {
  const [row] = await db
    .update(clinicalRecommendations)
    .set({
      status: ClinicalRecommendationStatus.CONFIRMED,
      confirmedAt: new Date().toISOString(),
      confirmedByUserId,
    })
    .where(
      and(
        eq(clinicalRecommendations.id, id),
        eq(clinicalRecommendations.patientId, patientId),
        eq(clinicalRecommendations.status, ClinicalRecommendationStatus.PENDING_REVIEW),
        isNull(clinicalRecommendations.deletedAt),
      ),
    )
    .returning();

  return row ?? null;
}

// Reopens a confirmed recommendation for editing. Requires re-confirming
// afterwards ("Editar" button next to "Confirmar recomendación").
export async function unlockClinicalRecommendationRow(
  patientId: string,
  id: string,
): Promise<ClinicalRecommendationRow | null> {
  const [row] = await db
    .update(clinicalRecommendations)
    .set({
      status: ClinicalRecommendationStatus.PENDING_REVIEW,
      confirmedAt: null,
      confirmedByUserId: null,
    })
    .where(
      and(
        eq(clinicalRecommendations.id, id),
        eq(clinicalRecommendations.patientId, patientId),
        eq(clinicalRecommendations.status, ClinicalRecommendationStatus.CONFIRMED),
        isNull(clinicalRecommendations.deletedAt),
      ),
    )
    .returning();

  return row ?? null;
}

// Persists provider edits to the output while it is still pending review.
export async function updateClinicalRecommendationOutput(
  patientId: string,
  id: string,
  output: ClinicalRecommendationRow['output'],
): Promise<ClinicalRecommendationRow | null> {
  const [row] = await db
    .update(clinicalRecommendations)
    .set({ output })
    .where(
      and(
        eq(clinicalRecommendations.id, id),
        eq(clinicalRecommendations.patientId, patientId),
        eq(clinicalRecommendations.status, ClinicalRecommendationStatus.PENDING_REVIEW),
        isNull(clinicalRecommendations.deletedAt),
      ),
    )
    .returning();

  return row ?? null;
}

export async function updateClinicalRecommendationShareSections(
  patientId: string,
  id: string,
  shareSections: ClinicalRecommendationRow['shareSections'],
): Promise<ClinicalRecommendationRow | null> {
  const [row] = await db
    .update(clinicalRecommendations)
    .set({ shareSections })
    .where(
      and(
        eq(clinicalRecommendations.id, id),
        eq(clinicalRecommendations.patientId, patientId),
        isNull(clinicalRecommendations.deletedAt),
      ),
    )
    .returning();

  return row ?? null;
}
