import { asc, eq } from 'drizzle-orm';

import { db } from '..';
import { labAnalytes } from '../models/lab-analytes';

type NewLabAnalyte = typeof labAnalytes.$inferInsert;

export async function findLabAnalytesByReportId(labReportId: string) {
  return db
    .select()
    .from(labAnalytes)
    .where(eq(labAnalytes.labReportId, labReportId))
    .orderBy(asc(labAnalytes.sortOrder));
}

export async function replaceLabAnalytes(
  labReportId: string,
  rows: Omit<NewLabAnalyte, 'labReportId'>[],
) {
  return db.transaction(async (tx) => {
    await tx.delete(labAnalytes).where(eq(labAnalytes.labReportId, labReportId));

    if (rows.length === 0) {
      return [];
    }

    return tx
      .insert(labAnalytes)
      .values(rows.map((row) => ({ ...row, labReportId })))
      .returning();
  });
}
