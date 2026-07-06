import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),

  // The Clinic / Hospital Group
  name: text('name').notNull(),

  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', {
    withTimezone: true,
    mode: 'string',
  }).$onUpdate(() => new Date().toISOString()),
  deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'string' }),
});
