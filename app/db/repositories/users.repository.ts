import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '..';
import { account } from '../models/auth';
import { UserRole } from '../models/enums';
import { organizations } from '../models/organizations';
import { providers } from '../models/providers';
import { users } from '../models/users';

type UserRow = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  providerId: string | null;
  organizationId: string | null;
  organizationName: string | null;
};

// Returns platform admins and providers for the admin user list.
export async function findAdminUsers(options?: { role?: UserRole | 'all' }) {
  const roleFilter =
    options?.role && options.role !== 'all'
      ? eq(users.role, options.role)
      : inArray(users.role, [UserRole.PLATFORM_ADMIN, UserRole.PROVIDER]);

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      providerId: providers.id,
      organizationId: providers.organizationId,
      organizationName: organizations.name,
    })
    .from(users)
    .leftJoin(
      providers,
      and(eq(providers.userId, users.id), isNull(providers.deletedAt)),
    )
    .leftJoin(organizations, eq(organizations.id, providers.organizationId))
    .where(and(isNull(users.deletedAt), roleFilter))
    .orderBy(asc(users.name));
}

// Returns a single admin-managed user with optional provider details.
export async function findAdminUserById(id: string): Promise<AdminUserRow | null> {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      providerId: providers.id,
      organizationId: providers.organizationId,
      organizationName: organizations.name,
    })
    .from(users)
    .leftJoin(
      providers,
      and(eq(providers.userId, users.id), isNull(providers.deletedAt)),
    )
    .leftJoin(organizations, eq(organizations.id, providers.organizationId))
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);

  return row ?? null;
}

// Returns a user by email, or null when not found.
export async function findUserByEmail(email: string, options?: { includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;
  const normalizedEmail = email.toLowerCase();

  const [row] = await db
    .select()
    .from(users)
    .where(
      includeDeleted
        ? eq(users.email, normalizedEmail)
        : and(eq(users.email, normalizedEmail), isNull(users.deletedAt)),
    )
    .limit(1);

  return row ?? null;
}

// Returns a user by id, or null when not found.
export async function findUserById(id: string, options?: { includeDeleted?: boolean }) {
  const includeDeleted = options?.includeDeleted ?? false;

  const [row] = await db
    .select()
    .from(users)
    .where(
      includeDeleted ? eq(users.id, id) : and(eq(users.id, id), isNull(users.deletedAt)),
    )
    .limit(1);

  return row ?? null;
}

// Inserts a user and returns the created row.
export async function insertUser(data: NewUser): Promise<UserRow> {
  const [row] = await db
    .insert(users)
    .values({ ...data, email: data.email.toLowerCase() })
    .returning();

  if (!row) {
    throw new Error('Failed to insert user');
  }

  return row;
}

// Updates a user by id and returns the updated row.
export async function updateUser(
  id: string,
  data: Partial<Pick<UserRow, 'name' | 'email' | 'role'>>,
): Promise<UserRow | null> {
  const values = {
    ...data,
    ...(data.email ? { email: data.email.toLowerCase() } : {}),
  };

  const [row] = await db
    .update(users)
    .set(values)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();

  return row ?? null;
}

// Soft-deletes a user by setting deletedAt.
export async function softDeleteUser(id: string): Promise<UserRow | null> {
  const [row] = await db
    .update(users)
    .set({ deletedAt: new Date().toISOString() })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning();

  return row ?? null;
}

// Inserts a credential account for email/password sign-in.
export async function insertCredentialAccount(input: {
  userId: string;
  passwordHash: string;
}) {
  const [row] = await db
    .insert(account)
    .values({
      userId: input.userId,
      providerId: 'credential',
      accountId: input.userId,
      password: input.passwordHash,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to insert credential account');
  }

  return row;
}

// Returns the credential account for a user, or null.
export async function findCredentialAccountByUserId(userId: string) {
  const [row] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
    .limit(1);

  return row ?? null;
}

// Updates the hashed password on a user's credential account.
export async function updateCredentialPassword(userId: string, passwordHash: string) {
  const [row] = await db
    .update(account)
    .set({ password: passwordHash })
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
    .returning();

  return row ?? null;
}
