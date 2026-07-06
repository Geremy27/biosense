import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { providerRole, ProviderRole } from './enums';
import { organizations } from './organizations';
import { users } from './users';

// Providers are the users who are providing services to patients
export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),

  role: providerRole('role').notNull().default(ProviderRole.DOCTOR),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),

  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', {
    withTimezone: true,
    mode: 'string',
  }).$onUpdate(() => new Date().toISOString()),
  deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'string' }),
});
