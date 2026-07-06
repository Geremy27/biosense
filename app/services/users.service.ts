import { eq } from 'drizzle-orm';

import { db } from '~/db';
import { account } from '~/db/models/auth';
import { AuditAction, ProviderRole, UserRole } from '~/db/models/enums';
import { providers } from '~/db/models/providers';
import { users } from '~/db/models/users';
import { findOrganizationById } from '~/db/repositories/organizations.repository';
import {
  findProviderByUserId,
  softDeleteProvider,
  updateProvider,
} from '~/db/repositories/providers.repository';
import {
  findAdminUserById,
  findAdminUsers,
  findCredentialAccountByUserId,
  findUserByEmail,
  findUserById,
  insertCredentialAccount,
  softDeleteUser,
  updateCredentialPassword,
  updateUser,
} from '~/db/repositories/users.repository';
import { generateTemporaryPassword, hashUserPassword } from '~/utils/password.server';

import { record } from './audit.service';
import { assertPlatformAdmin } from './authz';
import type { ActorContext } from './context';

export type UserListFilter = UserRole | 'all';

export type CreateUserInput = {
  name: string;
  email: string;
  role: UserRole.PLATFORM_ADMIN | UserRole.PROVIDER;
  organizationId?: string | null;
  password?: string | null;
};

export type UpdateUserInput = {
  name: string;
  email: string;
  role: UserRole.PLATFORM_ADMIN | UserRole.PROVIDER;
  organizationId?: string | null;
  password?: string | null;
};

export class UserValidationError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super('Validation failed');
    this.name = 'UserValidationError';
    this.fieldErrors = fieldErrors;
  }
}

// Lists admin-managed users, optionally filtered by role.
export async function listUsers(ctx: ActorContext, filter: UserListFilter = 'all') {
  assertPlatformAdmin(ctx);

  const rows = await findAdminUsers({ role: filter });

  await record(ctx, {
    action: AuditAction.LIST,
    entityType: 'user',
    metadata: { count: rows.length, filter },
  });

  return rows;
}

// Returns a single admin-managed user by id.
export async function getUser(ctx: ActorContext, id: string) {
  assertPlatformAdmin(ctx);

  const row = await findAdminUserById(id);

  await record(ctx, {
    action: AuditAction.VIEW,
    entityType: 'user',
    entityId: id,
    metadata: { found: row !== null },
  });

  return row;
}

// Creates a user with credentials and optional provider profile.
export async function createUser(ctx: ActorContext, input: CreateUserInput) {
  assertPlatformAdmin(ctx);

  const fieldErrors = validateUserInput(input, 'create');
  if (Object.keys(fieldErrors).length > 0) {
    throw new UserValidationError(fieldErrors);
  }

  const existing = await findUserByEmail(input.email, { includeDeleted: true });
  if (existing && !existing.deletedAt) {
    throw new UserValidationError({ email: 'Ya existe un usuario con este correo.' });
  }

  if (input.role === UserRole.PROVIDER) {
    const organization = await findOrganizationById(input.organizationId!);
    if (!organization) {
      throw new UserValidationError({ organizationId: 'Organización no encontrada.' });
    }
  }

  const tempPassword = input.password?.trim() || generateTemporaryPassword();
  const passwordHash = await hashUserPassword(tempPassword);

  const createdUser = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role: input.role,
        emailVerified: true,
      })
      .returning();

    if (!user) {
      throw new Error('Failed to create user');
    }

    await tx.insert(account).values({
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: passwordHash,
    });

    if (input.role === UserRole.PROVIDER) {
      await tx.insert(providers).values({
        userId: user.id,
        organizationId: input.organizationId!,
        role: ProviderRole.DOCTOR,
      });
    }

    return user;
  });

  await record(ctx, {
    action: AuditAction.CREATE,
    entityType: 'user',
    entityId: createdUser.id,
    metadata: {
      email: createdUser.email,
      role: createdUser.role,
      organizationId: input.organizationId ?? null,
    },
  });

  return { user: createdUser, temporaryPassword: tempPassword };
}

// Updates a user and syncs provider profile changes when applicable.
export async function updateUserById(ctx: ActorContext, id: string, input: UpdateUserInput) {
  assertPlatformAdmin(ctx);

  const before = await findAdminUserById(id);
  if (!before) {
    return null;
  }

  const fieldErrors = validateUserInput(input, 'update');
  if (Object.keys(fieldErrors).length > 0) {
    throw new UserValidationError(fieldErrors);
  }

  const emailOwner = await findUserByEmail(input.email);
  if (emailOwner && emailOwner.id !== id) {
    throw new UserValidationError({ email: 'Ya existe un usuario con este correo.' });
  }

  if (input.role === UserRole.PROVIDER) {
    const organization = await findOrganizationById(input.organizationId!);
    if (!organization) {
      throw new UserValidationError({ organizationId: 'Organización no encontrada.' });
    }
  }

  const updatedUser = await db.transaction(async (tx) => {
    const [user] = await tx
      .update(users)
      .set({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role: input.role,
      })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      return null;
    }

    const existingProvider = await findProviderByUserId(id);

    if (input.role === UserRole.PROVIDER) {
      if (existingProvider) {
        await tx
          .update(providers)
          .set({ organizationId: input.organizationId!, deletedAt: null })
          .where(eq(providers.id, existingProvider.id));
      } else {
        await tx.insert(providers).values({
          userId: id,
          organizationId: input.organizationId!,
          role: ProviderRole.DOCTOR,
        });
      }
    } else if (existingProvider) {
      await tx
        .update(providers)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(providers.id, existingProvider.id));
    }

    return user;
  });

  if (!updatedUser) {
    return null;
  }

  if (input.password?.trim()) {
    const passwordHash = await hashUserPassword(input.password.trim());
    const credential = await findCredentialAccountByUserId(id);

    if (credential) {
      await updateCredentialPassword(id, passwordHash);
    } else {
      await insertCredentialAccount({ userId: id, passwordHash });
    }
  }

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'user',
    entityId: id,
    metadata: {
      before: {
        name: before.name,
        email: before.email,
        role: before.role,
        organizationId: before.organizationId,
      },
      after: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        organizationId: input.organizationId ?? null,
      },
      passwordUpdated: Boolean(input.password?.trim()),
    },
  });

  return findAdminUserById(id);
}

// Soft-deletes a user and their provider profile when present.
export async function deleteUser(ctx: ActorContext, id: string) {
  assertPlatformAdmin(ctx);

  const before = await findUserById(id);
  if (!before) {
    return null;
  }

  if (before.id === ctx.userId) {
    throw new UserValidationError({ _form: 'No puedes desactivar tu propia cuenta.' });
  }

  const provider = await findProviderByUserId(id);
  if (provider) {
    await softDeleteProvider(provider.id);
  }

  const row = await softDeleteUser(id);

  await record(ctx, {
    action: AuditAction.DELETE,
    entityType: 'user',
    entityId: id,
    metadata: {
      before: {
        name: before.name,
        email: before.email,
        role: before.role,
      },
    },
  });

  return row;
}

// Validates user create/update input and returns field errors.
function validateUserInput(
  input: CreateUserInput | UpdateUserInput,
  mode: 'create' | 'update',
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.name.trim()) {
    errors.name = 'El nombre es obligatorio.';
  }

  if (!input.email.trim()) {
    errors.email = 'El correo es obligatorio.';
  } else if (!input.email.includes('@')) {
    errors.email = 'Ingresa un correo válido.';
  }

  if (input.role !== UserRole.PLATFORM_ADMIN && input.role !== UserRole.PROVIDER) {
    errors.role = 'Selecciona un rol válido.';
  }

  if (input.role === UserRole.PROVIDER && !input.organizationId) {
    errors.organizationId = 'La organización es obligatoria para prestadores.';
  }

  if (mode === 'create' && input.password?.trim() && input.password.trim().length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (mode === 'update' && input.password?.trim() && input.password.trim().length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  }

  return errors;
}
