import { AuditAction } from '~/db/models/enums';
import {
  findOrganizationById,
  findOrganizations,
  insertOrganization,
  softDeleteOrganization,
  updateOrganization,
} from '~/db/repositories/organizations.repository';

import { record } from './audit.service';
import { assertPlatformAdmin } from './authz';
import type { ActorContext } from './context';

export type CreateOrganizationInput = {
  name: string;
};

export type UpdateOrganizationInput = {
  name: string;
};

// Lists all organizations for platform admins.
export async function listOrganizations(ctx: ActorContext) {
  assertPlatformAdmin(ctx);

  const rows = await findOrganizations();

  await record(ctx, {
    action: AuditAction.LIST,
    entityType: 'organization',
    metadata: { count: rows.length },
  });

  return rows;
}

// Returns a single organization by id for platform admins.
export async function getOrganization(ctx: ActorContext, id: string) {
  assertPlatformAdmin(ctx);

  const row = await findOrganizationById(id);

  await record(ctx, {
    action: AuditAction.VIEW,
    entityType: 'organization',
    entityId: id,
    metadata: { found: row !== null },
  });

  return row;
}

// Creates a new organization for platform admins.
export async function createOrganization(ctx: ActorContext, input: CreateOrganizationInput) {
  assertPlatformAdmin(ctx);

  const row = await insertOrganization({ name: input.name });

  await record(ctx, {
    action: AuditAction.CREATE,
    entityType: 'organization',
    entityId: row.id,
    metadata: { name: row.name },
  });

  return row;
}

// Updates an organization for platform admins.
export async function updateOrganizationById(
  ctx: ActorContext,
  id: string,
  input: UpdateOrganizationInput,
) {
  assertPlatformAdmin(ctx);

  const before = await findOrganizationById(id);
  const row = await updateOrganization(id, { name: input.name });

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'organization',
    entityId: id,
    metadata: {
      before: before ? { name: before.name } : null,
      after: row ? { name: row.name } : null,
    },
  });

  return row;
}

// Soft-deletes an organization for platform admins.
export async function deleteOrganization(ctx: ActorContext, id: string) {
  assertPlatformAdmin(ctx);

  const before = await findOrganizationById(id);
  const row = await softDeleteOrganization(id);

  await record(ctx, {
    action: AuditAction.DELETE,
    entityType: 'organization',
    entityId: id,
    metadata: {
      before: before ? { name: before.name } : null,
    },
  });

  return row;
}
