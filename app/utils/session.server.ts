import { findProviderByUserId } from '~/db/repositories/providers.repository';
import { UserRole } from '~/db/models/enums';
import { parseUserRole, type ActorContext, type AuthSession } from '~/services/context';
import { buildContext } from '~/services/context';
import { auth } from '~/utils/auth.server';
import { redirect } from 'react-router';

// Returns request Cookie headers built from a sign-in response Set-Cookie values.
export function cookieHeadersFromSignInResponse(response: Response): Headers {
  const setCookies = response.headers.getSetCookie?.() ?? [];

  if (setCookies.length === 0) {
    return response.headers;
  }

  const cookie = setCookies.map((entry) => entry.split(';')[0]).join('; ');
  return new Headers({ cookie });
}

// Returns whether a role value represents a platform admin.
export function isPlatformAdminRole(role: unknown): boolean {
  return parseUserRole(role) === UserRole.PLATFORM_ADMIN;
}

// Returns whether a role value represents a provider.
export function isProviderRole(role: unknown): boolean {
  return parseUserRole(role) === UserRole.PROVIDER;
}

// Returns the current session from request cookies, or null when unauthenticated.
export async function getSession(request: Request): Promise<AuthSession | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session;
}

// Builds an actor context from the request, enriching provider id when applicable.
export async function buildActorContext(request: Request): Promise<ActorContext> {
  const session = await getSession(request);
  const ctx = buildContext(request, session);

  if (ctx.role === UserRole.PROVIDER && ctx.userId) {
    const provider = await findProviderByUserId(ctx.userId);
    return { ...ctx, providerId: provider?.id ?? null };
  }

  return ctx;
}

// Requires an authenticated platform admin session or redirects to admin login.
export async function requirePlatformAdmin(request: Request): Promise<AuthSession> {
  const session = await getSession(request);

  if (!session) {
    throw redirect('/admin/login');
  }

  if (!isPlatformAdminRole(session.user.role)) {
    throw redirect('/admin/login');
  }

  return session;
}

// Redirects authenticated platform admins away from the login page.
export async function redirectIfPlatformAdmin(request: Request) {
  const session = await getSession(request);

  if (session && isPlatformAdminRole(session.user.role)) {
    throw redirect('/admin');
  }
}

// Requires an authenticated provider session or redirects to provider login.
export async function requireProvider(request: Request): Promise<AuthSession> {
  const session = await getSession(request);

  if (!session) {
    throw redirect('/provider/login');
  }

  if (!isProviderRole(session.user.role)) {
    throw redirect('/provider/login');
  }

  const provider = await findProviderByUserId(session.user.id);
  if (!provider) {
    throw redirect('/provider/login');
  }

  return session;
}

// Redirects authenticated providers away from the login page.
export async function redirectIfProvider(request: Request) {
  const session = await getSession(request);

  if (!session || !isProviderRole(session.user.role)) {
    return;
  }

  const provider = await findProviderByUserId(session.user.id);
  if (provider) {
    throw redirect('/provider');
  }
}
