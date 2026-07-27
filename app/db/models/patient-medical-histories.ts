import { date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organizations } from './organizations';
import { patients } from './patients';
import { users } from './users';

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
    personalHistory: text('personal_history'),
    familyHistory: text('family_history'),
    surgicalHistory: text('surgical_history'),
    allergies: text('allergies'),
    medicationsAndSupplements: text('medications_and_supplements'),
    habitsLifestyle: text('habits_lifestyle'),
    notes: text('notes'),
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
  ],
);
