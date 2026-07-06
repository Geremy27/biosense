import { db } from '..';
import { auditLogs } from '../models/audit';
import type { AuditAction, UserRole } from '../models/enums';

type InsertAuditLogInput = {
  actorUserId?: string | null;
  actorRole?: UserRole | null;
  action: AuditAction;
  entityType: string;

  entityId?: string | null;
  patientId?: string | null;

  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;

  metadata?: Record<string, unknown> | null;
};

export async function insertAuditLog(input: InsertAuditLogInput) {
  const [row] = await db.insert(auditLogs).values(input).returning();

  if (!row) {
    throw new Error('Failed to insert audit log');
  }

  return row;
}
