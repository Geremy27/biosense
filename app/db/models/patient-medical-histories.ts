import { date, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { MedicalHistoryStatus, medicalHistoryStatus } from './enums';
import { organizations } from './organizations';
import { patients } from './patients';
import { users } from './users';

export type MedicalHistoryDatedItem = {
  label: string;
  detail: string | null;
  from: string;
  to: string | null;
};

export const patientMedicalHistories = pgTable(
  'patient_medical_histories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .references(() => patients.id)
      .notNull(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id)
      .notNull(),
    title: text('title').notNull(),
    recordedAt: date('recorded_at', { mode: 'string' }).notNull(),
    chiefComplaint: text('chief_complaint'),

    // Dated structured lists. Empty array when unknown/absent.
    personalHistory1: jsonb('personal_history_1')
      .$type<MedicalHistoryDatedItem[]>()
      .notNull()
      .default([]),
    personalHistory2: jsonb('personal_history_2')
      .$type<MedicalHistoryDatedItem[]>()
      .notNull()
      .default([]),
    surgicalHistory: jsonb('surgical_history')
      .$type<MedicalHistoryDatedItem[]>()
      .notNull()
      .default([]),
    medications: jsonb('medications').$type<MedicalHistoryDatedItem[]>().notNull().default([]),
    supplements: jsonb('supplements').$type<MedicalHistoryDatedItem[]>().notNull().default([]),
    diet: jsonb('diet').$type<MedicalHistoryDatedItem[]>().notNull().default([]),
    toxicologicalHistory: jsonb('toxicological_history')
      .$type<MedicalHistoryDatedItem[]>()
      .notNull()
      .default([]),

    // Narrative free-text sections.
    infectiousHistory: text('infectious_history'),
    traumaticHistory: text('traumatic_history'),
    allergies: text('allergies'),
    vaccines: text('vaccines'),
    habits: text('habits'),
    gynecoObstetricHistory: text('gyneco_obstetric_history'),
    familyHistory: text('family_history'),
    psychosocialHistory: text('psychosocial_history'),
    notes: text('notes'),

    // Un antecedente confirmado no puede editarse ni eliminarse por ley.
    status: medicalHistoryStatus('status').notNull().default(MedicalHistoryStatus.DRAFT),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
    confirmedByUserId: uuid('confirmed_by_user_id').references(() => users.id),

    // Present only when the record was created by uploading a PDF (status
    // starts at 'extracting' and moves to 'draft' or 'failed').
    originalFilename: text('original_filename'),
    extractionModel: text('extraction_model'),
    extractionError: text('extraction_error'),
    extractedAt: timestamp('extracted_at', { withTimezone: true, mode: 'string' }),

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
    index('patient_medical_histories_patient_idx').on(table.patientId),
    index('patient_medical_histories_patient_recorded_idx').on(
      table.patientId,
      table.recordedAt,
    ),
    index('patient_medical_histories_patient_status_idx').on(table.patientId, table.status),
  ],
);
