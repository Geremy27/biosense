import type { AuditAction } from '~/db/models/enums';
import { insertAuditLog } from '~/db/repositories';

import type { ActorContext } from './context';

export type RecordAuditPayload = {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  patientId?: string | null;
  metadata?: Record<string, unknown> | null;
};

// MVP: audit failures are logged but do not block the caller (fail-open).
// For stricter HIPAA compliance later, rethrow or fail-closed so operations
// cannot proceed without a successful audit write.
export async function record(ctx: ActorContext, payload: RecordAuditPayload): Promise<void> {
  try {
    await insertAuditLog({
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId ?? null,
      patientId: payload.patientId ?? null,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
      metadata: payload.metadata ?? null,
    });
  } catch (error) {
    console.error('[audit] Failed to write audit log', {
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      patientId: payload.patientId,
      requestId: ctx.requestId,
      error,
    });
  }
}
