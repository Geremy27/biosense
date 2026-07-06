import { Form, redirect, useActionData } from 'react-router';
import { AuditAction } from '~/db/models/enums';
import { record } from '~/services/audit.service';
import { buildContext, type AuthSession } from '~/services/context';
import { auth } from '~/utils/auth.server';
import {
  cookieHeadersFromSignInResponse,
  isPlatformAdminRole,
  redirectIfPlatformAdmin,
} from '~/utils/session.server';

import type { Route } from './+types/login';

export async function loader({ request }: Route.LoaderArgs) {
  await redirectIfPlatformAdmin(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const ctx = buildContext(request, null);

  if (!email || !password) {
    return { error: 'El correo y la contraseña son obligatorios.' };
  }

  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: request.headers,
      asResponse: true,
    });

    if (!response.ok) {
      await record(ctx, {
        action: AuditAction.LOGIN_FAILED,
        entityType: 'session',
        metadata: { email },
      });

      return { error: 'Correo o contraseña incorrectos.' };
    }

    const signInResult = (await response.json()) as {
      token: string;
      user: AuthSession['user'];
    };

    if (!isPlatformAdminRole(signInResult.user?.role)) {
      await auth.api.signOut({
        headers: cookieHeadersFromSignInResponse(response),
      });

      await record(ctx, {
        action: AuditAction.LOGIN_FAILED,
        entityType: 'session',
        metadata: { email, reason: 'not_platform_admin' },
      });

      return { error: 'Esta cuenta no tiene acceso de administrador de plataforma.' };
    }

    const authedCtx = buildContext(request, {
      user: signInResult.user,
      session: {
        id: signInResult.token,
        userId: signInResult.user.id,
        token: signInResult.token,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as AuthSession);

    await record(authedCtx, {
      action: AuditAction.LOGIN,
      entityType: 'user',
      entityId: signInResult.user.id,
      metadata: { email: signInResult.user.email },
    });

    throw redirect('/admin', { headers: response.headers });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    await record(ctx, {
      action: AuditAction.LOGIN_FAILED,
      entityType: 'session',
      metadata: { email },
    });

    return { error: 'Correo o contraseña incorrectos.' };
  }
}

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Iniciar sesión — Health EMR' }];
}

export default function AdminLogin() {
  const actionData = useActionData<typeof action>();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="aurora-bg" aria-hidden />

      <div className="relative z-10 w-full max-w-md card-elevated">
        <p className="eyebrow">Administración de plataforma</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-cyan-950">Iniciar sesión</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Accede al área de administración de la plataforma. Las cuentas de prestadores usan un
          portal separado.
        </p>

        <Form method="post" className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
            />
          </div>

          {actionData?.error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionData.error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full">
            Iniciar sesión
          </button>
        </Form>
      </div>
    </main>
  );
}
