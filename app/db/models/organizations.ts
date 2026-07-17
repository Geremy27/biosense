import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { OrganizationType, organizationType } from './enums';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),

  // The Clinic / Hospital Group
  name: text('name').notNull(),
  type: organizationType('type').notNull().default(OrganizationType.PERSONA_JURIDICA),

  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', {
    withTimezone: true,
    mode: 'string',
  }).$onUpdate(() => new Date().toISOString()),
  deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'string' }),
});
