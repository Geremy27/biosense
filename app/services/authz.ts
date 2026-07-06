import { UserRole } from '~/db/models/enums';

import type { ActorContext } from './context';

export class AuthorizationError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Ensures the actor is a platform admin.
export function assertPlatformAdmin(ctx: ActorContext): void {
  if (ctx.role !== UserRole.PLATFORM_ADMIN) {
    throw new AuthorizationError('Platform admin access required');
  }
}

// Ensures the actor is a platform admin or the given provider.
export function assertPlatformAdminOrSelf(ctx: ActorContext, providerId: string): boolean {
  if (ctx.role === UserRole.PLATFORM_ADMIN) {
    return true;
  }

  if (ctx.role === UserRole.PROVIDER && ctx.providerId === providerId) {
    return true;
  }

  throw new AuthorizationError();
}
