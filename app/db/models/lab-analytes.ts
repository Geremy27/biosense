import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { labReports } from './lab-reports';
import { patients } from './patients';

export const labAnalytes = pgTable(
  'lab_analytes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    labReportId: uuid('lab_report_id')
      .references(() => labReports.id, { onDelete: 'cascade' })
      .notNull(),
    patientId: uuid('patient_id')
      .references(() => patients.id)
      .notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    name: text('name').notNull(),
    value: text('value').notNull(),
    unit: text('unit'),
    referenceRange: text('reference_range'),
    optimalRange: text('optimal_range'),
    flag: text('flag'),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', {
      withTimezone: true,
      mode: 'string',
    }).$onUpdate(() => new Date().toISOString()),
  },
  (table) => [
    index('lab_analytes_report_idx').on(table.labReportId),
    index('lab_analytes_patient_idx').on(table.patientId),
  ],
);
