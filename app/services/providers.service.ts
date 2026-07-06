import { AuditAction, ProviderRole } from '~/db/models/enums';
import {
  findProviderById,
  findProviderByUserId,
  findProviders,
  insertProvider,
  softDeleteProvider,
  updateProvider,
} from '~/db/repositories/providers.repository';

import { record } from './audit.service';
import { assertPlatformAdmin, assertPlatformAdminOrSelf } from './authz';
import type { ActorContext } from './context';

export type CreateProviderInput = {
  userId: string;
  organizationId: string;
  role?: ProviderRole;
};

export type UpdateProviderInput = {
  organizationId?: string;
  role?: ProviderRole;
};

// Lists providers, optionally filtered by organization (platform admin only).
export async function listProviders(ctx: ActorContext, organizationId?: string) {
  assertPlatformAdmin(ctx);

  const rows = await findProviders({ organizationId });

  await record(ctx, {
    action: AuditAction.LIST,
    entityType: 'provider',
    metadata: { count: rows.length, organizationId: organizationId ?? null },
  });

  return rows;
}

// Returns a provider by id for platform admins or the provider themselves.
export async function getProvider(ctx: ActorContext, id: string) {
  assertPlatformAdminOrSelf(ctx, id);

  const row = await findProviderById(id);

  await record(ctx, {
    action: AuditAction.VIEW,
    entityType: 'provider',
    entityId: id,
    metadata: { found: row !== null },
  });

  return row;
}

// Returns the provider profile for the current user.
export async function getMyProvider(ctx: ActorContext) {
  if (!ctx.userId) {
    return null;
  }

  const row = await findProviderByUserId(ctx.userId);

  if (row) {
    await record(ctx, {
      action: AuditAction.VIEW,
      entityType: 'provider',
      entityId: row.id,
    });
  }

  return row;
}

// Creates a provider profile for platform admins.
export async function createProvider(ctx: ActorContext, input: CreateProviderInput) {
  assertPlatformAdmin(ctx);

  const row = await insertProvider({
    userId: input.userId,
    organizationId: input.organizationId,
    role: input.role ?? ProviderRole.DOCTOR,
  });

  await record(ctx, {
    action: AuditAction.CREATE,
    entityType: 'provider',
    entityId: row.id,
    metadata: {
      userId: row.userId,
      organizationId: row.organizationId,
      role: row.role,
    },
  });

  return row;
}

// Updates a provider profile for platform admins.
export async function updateProviderById(
  ctx: ActorContext,
  id: string,
  input: UpdateProviderInput,
) {
  assertPlatformAdmin(ctx);

  const before = await findProviderById(id);
  const row = await updateProvider(id, input);

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'provider',
    entityId: id,
    metadata: {
      before: before
        ? {
            organizationId: before.organizationId,
            role: before.role,
          }
        : null,
      after: row
        ? {
            organizationId: row.organizationId,
            role: row.role,
          }
        : null,
    },
  });

  return row;
}

// Soft-deletes a provider profile for platform admins.
export async function deleteProvider(ctx: ActorContext, id: string) {
  assertPlatformAdmin(ctx);

  const before = await findProviderById(id);
  const row = await softDeleteProvider(id);

  await record(ctx, {
    action: AuditAction.DELETE,
    entityType: 'provider',
    entityId: id,
    metadata: {
      before: before
        ? {
            userId: before.userId,
            organizationId: before.organizationId,
          }
        : null,
    },
  });

  return row;
}
