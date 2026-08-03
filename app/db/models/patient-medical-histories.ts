import { date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { MedicalHistoryStatus, medicalHistoryStatus } from './enums';
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

    // Legacy free-text columns. No longer written by the current form, kept
    // read-only for data continuity on records created before the structured
    // items below existed. New records leave these null.
    personalHistory: text('personal_history'),
    medicationsAndSupplements: text('medications_and_supplements'),
    habitsLifestyle: text('habits_lifestyle'),

    // Personales 1: diagnósticos dados, con fecha o hace cuánto.
    personalHistory1: text('personal_history_1'),
    // Personales 2: diagnósticos que están en estudio.
    personalHistory2: text('personal_history_2'),
    // Quirúrgicos: cuál procedimiento y fecha.
    surgicalHistory: text('surgical_history'),
    // Medicamentosos: cuáles, cómo y fecha de inicio.
    medications: text('medications'),
    // Suplementos: cuáles, cómo y fecha de inicio.
    supplements: text('supplements'),
    // Infecciosos recurrentes.
    infectiousHistory: text('infectious_history'),
    // Traumáticos: físicos, emocionales y psicológicos, cuáles y cuándo.
    traumaticHistory: text('traumatic_history'),
    // Toxicológicos: fuma o toma, cantidad y frecuencia.
    toxicologicalHistory: text('toxicological_history'),
    // Alergias conocidas a medicamentos o alimentos.
    allergies: text('allergies'),
    // Vacunas: últimas de los últimos 5 años, cuántas dosis. No aplica a todos.
    vaccines: text('vaccines'),
    // Hábitos: frecuencia de micción/deposiciones al día y características especiales.
    habits: text('habits'),
    // G/O: únicamente para pacientes mujeres. No siempre disponible.
    gynecoObstetricHistory: text('gyneco_obstetric_history'),
    // Familiares: padres, abuelos.
    familyHistory: text('family_history'),
    // Psicosociales: enfermedad predominante en el círculo de amigos. Difícil de obtener.
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
