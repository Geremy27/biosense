import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { UserRole, userRole } from './enums';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  role: userRole('role').notNull().default(UserRole.PATIENT),

  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', {
    withTimezone: true,
    mode: 'string',
  }).$onUpdate(() => new Date().toISOString()),
  deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'string' }),
});
