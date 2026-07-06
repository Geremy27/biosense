import { and, eq, isNull } from 'drizzle-orm';

import { db } from '..';
import { organizations } from '../models/organizations';

type OrganizationRow = typeof organizations.$inferSelect;
type NewOrganization = typeof organizations.$inferInsert;

// Returns all organizations, excluding soft-deleted rows by default.
export async function findOrganizations(options?: { includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;

  return db
    .select()
    .from(organizations)
    .where(includeDeleted ? undefined : isNull(organizations.deletedAt));
}

// Returns a single organization by id, or null when not found.
export async function findOrganizationById(id: string, options?: { includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;

  const [row] = await db
    .select()
    .from(organizations)
    .where(
      includeDeleted
        ? eq(organizations.id, id)
        : and(eq(organizations.id, id), isNull(organizations.deletedAt)),
    )
    .limit(1);

  return row ?? null;
}

// Inserts a new organization and returns the created row.
export async function insertOrganization(data: NewOrganization): Promise<OrganizationRow> {
  const [row] = await db.insert(organizations).values(data).returning();

  if (!row) {
    throw new Error('Failed to insert organization');
  }

  return row;
}

// Updates an organization by id and returns the updated row.
export async function updateOrganization(
  id: string,
  data: Partial<Pick<OrganizationRow, 'name'>>,
): Promise<OrganizationRow | null> {
  const [row] = await db
    .update(organizations)
    .set(data)
    .where(and(eq(organizations.id, id), isNull(organizations.deletedAt)))
    .returning();

  return row ?? null;
}

// Soft-deletes an organization by setting deletedAt.
export async function softDeleteOrganization(id: string): Promise<OrganizationRow | null> {
  const [row] = await db
    .update(organizations)
    .set({ deletedAt: new Date().toISOString() })
    .where(and(eq(organizations.id, id), isNull(organizations.deletedAt)))
    .returning();

  return row ?? null;
}
