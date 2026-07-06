import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { auditAction, userRole } from './enums';
import { patients } from './patients';
import { users } from './users';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    actorUserId: uuid('actor_user_id').references(() => users.id),
    actorRole: userRole('actor_role'),
    action: auditAction('action').notNull(),

    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    patientId: uuid('patient_id').references(() => patients.id),

    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    requestId: text('request_id'),
    metadata: jsonb('metadata'),

    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_created_at_idx').on(table.createdAt),
    index('audit_logs_actor_user_id_idx').on(table.actorUserId),
    index('audit_logs_patient_id_idx').on(table.patientId),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  ],
);
