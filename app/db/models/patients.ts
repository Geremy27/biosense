import { date, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { identificationType, sex } from './enums';
import { organizations } from './organizations';
import { providers } from './providers';

export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    organizationId: uuid('organization_id')
      .references(() => organizations.id)
      .notNull(),
    primaryProviderId: uuid('primary_provider_id')
      .references(() => providers.id)
      .notNull(),

    identificationType: identificationType('identification_type').notNull(),
    identificationNumber: text('identification_number').notNull(),

    firstName: text('first_name').notNull(),
    secondName: text('second_name'),
    firstLastName: text('first_last_name').notNull(),
    secondLastName: text('second_last_name'),

    birthDate: date('birth_date', { mode: 'string' }).notNull(),
    birthPlace: text('birth_place').notNull(),
    residencePlace: text('residence_place').notNull(),

    phone: text('phone').notNull(),
    email: text('email'),

    sex: sex('sex'),
    ethnicity: text('ethnicity'),

    heightCm: numeric('height_cm', { precision: 5, scale: 2 }),
    weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),

    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', {
      withTimezone: true,
      mode: 'string',
    }).$onUpdate(() => new Date().toISOString()),
    deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    uniqueIndex('patients_org_identification_unique').on(
      table.organizationId,
      table.identificationType,
      table.identificationNumber,
    ),
  ],
);
