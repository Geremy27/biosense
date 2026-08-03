import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import {
  ClinicalRecommendationStatus,
  clinicalRecommendationStatus,
} from './enums';
import { labReports } from './lab-reports';
import { organizations } from './organizations';
import { patients } from './patients';
import { recommendationPrompts } from './recommendation-prompts';
import { users } from './users';

export const clinicalRecommendations = pgTable(
  'clinical_recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .references(() => patients.id)
      .notNull(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id)
      .notNull(),
    labReportId: uuid('lab_report_id')
      .references(() => labReports.id)
      .notNull(),
    promptId: uuid('prompt_id').references(() => recommendationPrompts.id),
    promptSnapshot: text('prompt_snapshot').notNull(),
    model: text('model').notNull(),
    status: clinicalRecommendationStatus('status')
      .notNull()
      .default(ClinicalRecommendationStatus.GENERATING),
    inputPatientSnapshot: jsonb('input_patient_snapshot').notNull(),
    inputLabSnapshot: jsonb('input_lab_snapshot').notNull(),
    inputMedicalHistorySnapshot: jsonb('input_medical_history_snapshot'),
    inputMedicationsSnapshot: text('input_medications_snapshot'),
    output: jsonb('output'),
    // Which sections the provider chose to include in the patient-facing
    // printable/PDF export. Null until the provider opens the share screen.
    shareSections: jsonb('share_sections'),
    generationError: text('generation_error'),
    generatedAt: timestamp('generated_at', { withTimezone: true, mode: 'string' }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
    confirmedByUserId: uuid('confirmed_by_user_id').references(() => users.id),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
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
    index('clinical_recommendations_patient_idx').on(table.patientId),
    index('clinical_recommendations_lab_report_idx').on(table.labReportId),
    index('clinical_recommendations_patient_status_idx').on(table.patientId, table.status),
  ],
);
