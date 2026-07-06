import { Form, Link, redirect, useActionData } from 'react-router';
import { LoginPageShell } from '~/components/auth/login-page-shell';
import { FormError } from '~/components/forms/form-error';
import { FormField } from '~/components/forms/form-field';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import { AuditAction } from '~/db/models/enums';
import { findProviderByUserId } from '~/db/repositories/providers.repository';
import { record } from '~/services/audit.service';
import { buildContext, type AuthSession } from '~/services/context';
import { auth } from '~/utils/auth.server';
import {
  cookieHeadersFromSignInResponse,
  isProviderRole,
  redirectIfProvider,
} from '~/utils/session.server';

import type { Route } from './+types/login';

export async function loader({ request }: Route.LoaderArgs) {
  await redirectIfProvider(request);
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

    if (!isProviderRole(signInResult.user?.role)) {
      await auth.api.signOut({
        headers: cookieHeadersFromSignInResponse(response),
      });

      await record(ctx, {
        action: AuditAction.LOGIN_FAILED,
        entityType: 'session',
        metadata: { email, reason: 'not_provider' },
      });

      return { error: 'Esta cuenta no tiene acceso de prestador.' };
    }

    const provider = await findProviderByUserId(signInResult.user.id);
    if (!provider) {
      await auth.api.signOut({
        headers: cookieHeadersFromSignInResponse(response),
      });

      await record(ctx, {
        action: AuditAction.LOGIN_FAILED,
        entityType: 'session',
        metadata: { email, reason: 'provider_profile_missing' },
      });

      return { error: 'Esta cuenta de prestador no está activa.' };
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

    throw redirect('/provider', { headers: response.headers });
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

export default function ProviderLogin() {
  const actionData = useActionData<typeof action>();

  return (
    <LoginPageShell
      eyebrow="Portal de prestadores"
      title="Iniciar sesión"
      description="Accede a tu panel clínico. Los administradores de plataforma usan un portal separado."
      footer={
        <p className="text-center text-sm text-slate-500">
          ¿Eres administrador?{' '}
          <Link to="/admin/login" className="font-semibold text-cyan-600 hover:text-cyan-800">
            Ir al portal de administración
          </Link>
        </p>
      }
    >
      <Form method="post" className="mt-8 space-y-4">
        <FormPendingFieldset className="space-y-4">
          <FormField id="email" label="Correo electrónico">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
            />
          </FormField>

          <FormField id="password" label="Contraseña">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
            />
          </FormField>

          {actionData?.error ? <FormError message={actionData.error} /> : null}

          <SubmitButton loadingLabel="Iniciando sesión…" className="w-full">
            Iniciar sesión
          </SubmitButton>
        </FormPendingFieldset>
      </Form>
    </LoginPageShell>
  );
}
