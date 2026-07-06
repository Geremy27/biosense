import { relations } from 'drizzle-orm';

import { auditLogs } from './models/audit';
import { account, session } from './models/auth';
import { organizations } from './models/organizations';
import { patients } from './models/patients';
import { providers } from './models/providers';
import { users } from './models/users';

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  providers: many(providers),
  auditLogs: many(auditLogs),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(users, {
    fields: [session.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  providers: many(providers),
  patients: many(patients),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, {
    fields: [providers.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [providers.organizationId],
    references: [organizations.id],
  }),
  patients: many(patients),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [patients.organizationId],
    references: [organizations.id],
  }),
  primaryProvider: one(providers, {
    fields: [patients.primaryProviderId],
    references: [providers.id],
  }),
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [auditLogs.patientId],
    references: [patients.id],
  }),
}));
