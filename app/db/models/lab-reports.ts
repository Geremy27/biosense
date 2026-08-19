import { date, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { LabReportStatus, labReportStatus } from './enums';
import { organizations } from './organizations';
import { patientMedicalHistories } from './patient-medical-histories';
import { patients } from './patients';
import { providers } from './providers';
import { users } from './users';

export const labReports = pgTable(
  'lab_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .references(() => patients.id)
      .notNull(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id)
      .notNull(),
    uploadedByProviderId: uuid('uploaded_by_provider_id')
      .references(() => providers.id)
      .notNull(),
    // Required for new uploads in the app; nullable so legacy rows remain valid.
    medicalHistoryId: uuid('medical_history_id').references(() => patientMedicalHistories.id),

    originalFilename: text('original_filename').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),

    status: labReportStatus('status').notNull().default(LabReportStatus.EXTRACTING),
    labName: text('lab_name'),
    panelName: text('panel_name'),
    collectedAt: date('collected_at', { mode: 'string' }),
    extractionModel: text('extraction_model'),
    extractionError: text('extraction_error'),
    extractedAt: timestamp('extracted_at', { withTimezone: true, mode: 'string' }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
    confirmedByUserId: uuid('confirmed_by_user_id').references(() => users.id),

    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', {
      withTimezone: true,
      mode: 'string',
    }).$onUpdate(() => new Date().toISOString()),
    deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index('lab_reports_patient_idx').on(table.patientId),
    index('lab_reports_organization_idx').on(table.organizationId),
    index('lab_reports_patient_status_idx').on(table.patientId, table.status),
    index('lab_reports_medical_history_idx').on(table.medicalHistoryId),
  ],
);
