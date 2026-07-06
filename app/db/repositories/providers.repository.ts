import { and, eq, isNull } from 'drizzle-orm';

import { db } from '..';
import { providers } from '../models/providers';

type ProviderRow = typeof providers.$inferSelect;
type NewProvider = typeof providers.$inferInsert;

// Returns providers, optionally scoped to an organization.
export async function findProviders(options?: {
  organizationId?: string;
  includeDeleted?: boolean;
}) {
  const includeDeleted = options?.includeDeleted ?? false;
  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(providers.deletedAt));
  }

  if (options?.organizationId) {
    conditions.push(eq(providers.organizationId, options.organizationId));
  }

  return db
    .select()
    .from(providers)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
}

// Returns a provider by id, or null when not found.
export async function findProviderById(id: string, options?: { includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;

  const [row] = await db
    .select()
    .from(providers)
    .where(
      includeDeleted
        ? eq(providers.id, id)
        : and(eq(providers.id, id), isNull(providers.deletedAt)),
    )
    .limit(1);

  return row ?? null;
}

// Returns the provider profile linked to a user id, or null.
export async function findProviderByUserId(userId: string, options?: { includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;

  const [row] = await db
    .select()
    .from(providers)
    .where(
      includeDeleted
        ? eq(providers.userId, userId)
        : and(eq(providers.userId, userId), isNull(providers.deletedAt)),
    )
    .limit(1);

  return row ?? null;
}

// Inserts a new provider and returns the created row.
export async function insertProvider(data: NewProvider): Promise<ProviderRow> {
  const [row] = await db.insert(providers).values(data).returning();

  if (!row) {
    throw new Error('Failed to insert provider');
  }

  return row;
}

// Updates a provider by id and returns the updated row.
export async function updateProvider(
  id: string,
  data: Partial<Pick<ProviderRow, 'role' | 'organizationId'>>,
): Promise<ProviderRow | null> {
  const [row] = await db
    .update(providers)
    .set(data)
    .where(and(eq(providers.id, id), isNull(providers.deletedAt)))
    .returning();

  return row ?? null;
}

// Soft-deletes a provider by setting deletedAt.
export async function softDeleteProvider(id: string): Promise<ProviderRow | null> {
  const [row] = await db
    .update(providers)
    .set({ deletedAt: new Date().toISOString() })
    .where(and(eq(providers.id, id), isNull(providers.deletedAt)))
    .returning();

  return row ?? null;
}
