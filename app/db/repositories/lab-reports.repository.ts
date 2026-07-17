import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '..';
import { labAnalytes } from '../models/lab-analytes';
import { LabReportStatus } from '../models/enums';
import { labReports } from '../models/lab-reports';

type LabReportRow = typeof labReports.$inferSelect;
type NewLabReport = typeof labReports.$inferInsert;
type NewLabAnalyte = typeof labAnalytes.$inferInsert;

export async function findLabReportsByPatientId(patientId: string) {
  return db
    .select()
    .from(labReports)
    .where(and(eq(labReports.patientId, patientId), isNull(labReports.deletedAt)))
    .orderBy(desc(labReports.createdAt));
}

export async function findLabReportByPatientAndId(patientId: string, id: string) {
  const [row] = await db
    .select()
    .from(labReports)
    .where(
      and(
        eq(labReports.id, id),
        eq(labReports.patientId, patientId),
        isNull(labReports.deletedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function insertLabReport(data: NewLabReport): Promise<LabReportRow> {
  const [row] = await db.insert(labReports).values(data).returning();

  if (!row) {
    throw new Error('Failed to insert lab report');
  }

  return row;
}

export async function updateLabReport(
  patientId: string,
  id: string,
  data: Partial<
    Pick<
      LabReportRow,
      | 'status'
      | 'labName'
      | 'panelName'
      | 'collectedAt'
      | 'extractionModel'
      | 'extractionError'
      | 'extractedAt'
      | 'confirmedAt'
      | 'confirmedByUserId'
    >
  >,
): Promise<LabReportRow | null> {
  const [row] = await db
    .update(labReports)
    .set(data)
    .where(
      and(
        eq(labReports.id, id),
        eq(labReports.patientId, patientId),
        isNull(labReports.deletedAt),
      ),
    )
    .returning();

  return row ?? null;
}

export async function confirmLabReportWithAnalytes(
  patientId: string,
  id: string,
  reportData: Pick<
    LabReportRow,
    'labName' | 'panelName' | 'collectedAt' | 'confirmedAt' | 'confirmedByUserId'
  >,
  analytes: Omit<NewLabAnalyte, 'labReportId'>[],
) {
  return db.transaction(async (tx) => {
    const [report] = await tx
      .update(labReports)
      .set({ ...reportData, status: LabReportStatus.CONFIRMED })
      .where(
        and(
          eq(labReports.id, id),
          eq(labReports.patientId, patientId),
          eq(labReports.status, LabReportStatus.PENDING_REVIEW),
          isNull(labReports.deletedAt),
        ),
      )
      .returning();

    if (!report) {
      return null;
    }

    await tx.delete(labAnalytes).where(eq(labAnalytes.labReportId, id));
    const rows =
      analytes.length > 0
        ? await tx
            .insert(labAnalytes)
            .values(analytes.map((analyte) => ({ ...analyte, labReportId: id })))
            .returning()
        : [];

    return { report, analytes: rows };
  });
}
