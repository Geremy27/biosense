import { UserRole } from '~/db/models/enums';
import { auth } from '~/utils/auth.server';

export type AuthSession = typeof auth.$Infer.Session;

export interface ActorContext {
  userId: string | null;
  role: UserRole | null;
  providerId: string | null;

  ipAddress: string | null;
  userAgent: string | null;
  requestId: string;
}

// Returns the client IP from proxy headers when present.
function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const clientIp = forwarded.split(',')[0]?.trim();
    if (clientIp) {
      return clientIp;
    }
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }

  return null;
}

// Parses a session role string into a known UserRole value.
export function parseUserRole(role: unknown): UserRole | null {
  if (typeof role !== 'string') {
    return null;
  }

  if ((Object.values(UserRole) as string[]).includes(role)) {
    return role as UserRole;
  }

  return null;
}

// Builds actor context from the request and auth session for service-layer calls.
export function buildContext(request: Request, session: AuthSession | null): ActorContext {
  return {
    userId: session?.user.id ?? null,
    role: session ? parseUserRole(session.user.role) : null,
    providerId: null,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent'),
    requestId: crypto.randomUUID(),
  };
}
