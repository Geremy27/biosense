import { relations } from 'drizzle-orm';

import { auditLogs } from './models/audit';
import { account, session } from './models/auth';
import { labAnalytes } from './models/lab-analytes';
import { labReports } from './models/lab-reports';
import { organizations } from './models/organizations';
import { patients } from './models/patients';
import { providers } from './models/providers';
import { users } from './models/users';

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  providers: many(providers),
  auditLogs: many(auditLogs),
  confirmedLabReports: many(labReports),
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
  labReports: many(labReports),
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
  uploadedLabReports: many(labReports),
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
  labReports: many(labReports),
  labAnalytes: many(labAnalytes),
}));

export const labReportsRelations = relations(labReports, ({ one, many }) => ({
  patient: one(patients, {
    fields: [labReports.patientId],
    references: [patients.id],
  }),
  organization: one(organizations, {
    fields: [labReports.organizationId],
    references: [organizations.id],
  }),
  uploadedByProvider: one(providers, {
    fields: [labReports.uploadedByProviderId],
    references: [providers.id],
  }),
  confirmedByUser: one(users, {
    fields: [labReports.confirmedByUserId],
    references: [users.id],
  }),
  analytes: many(labAnalytes),
}));

export const labAnalytesRelations = relations(labAnalytes, ({ one }) => ({
  report: one(labReports, {
    fields: [labAnalytes.labReportId],
    references: [labReports.id],
  }),
  patient: one(patients, {
    fields: [labAnalytes.patientId],
    references: [patients.id],
  }),
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
