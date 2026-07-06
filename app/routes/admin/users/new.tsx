import { useState } from 'react';
import { Form, Link, useActionData, useLoaderData } from 'react-router';

import { Breadcrumbs } from '~/components/ui/breadcrumbs';
import { PageHeader } from '~/components/ui/page-header';
import { UserRole } from '~/db/models/enums';
import { listOrganizations } from '~/services/organizations.service';
import { createUser, UserValidationError } from '~/services/users.service';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/new';

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const organizations = await listOrganizations(ctx);

  return { organizations };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const ctx = await buildActorContext(request);
  const role = String(formData.get('role') ?? '');

  try {
    const result = await createUser(ctx, {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      role: role as UserRole.PLATFORM_ADMIN | UserRole.PROVIDER,
      organizationId: String(formData.get('organizationId') ?? '') || null,
      password: String(formData.get('password') ?? '') || null,
    });

    return {
      ok: true,
      temporaryPassword: result.temporaryPassword,
      user: result.user,
    };
  } catch (error) {
    if (error instanceof UserValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Nuevo usuario — Health EMR' }];
}

export default function NewUser() {
  const { organizations } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [role, setRole] = useState<UserRole.PLATFORM_ADMIN | UserRole.PROVIDER>(
    UserRole.PROVIDER,
  );

  if (actionData?.ok) {
    return (
      <div className="max-w-xl">
        <Breadcrumbs
          items={[
            { label: 'Panel', to: '/admin' },
            { label: 'Usuarios', to: '/admin/users' },
            { label: 'Usuario creado' },
          ]}
        />
        <div className="card-elevated">
          <PageHeader eyebrow="Usuarios" title="Usuario creado" />
          <p className="mt-3 text-sm text-slate-500">
            Comparte esta contraseña temporal de forma segura con {actionData.user.name}. Debería
            cambiarla después del primer inicio de sesión, cuando el portal de prestadores esté
            disponible.
          </p>

          <div className="mt-6 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-600">
              Contraseña temporal
            </p>
            <p className="mt-2 font-mono text-lg font-bold text-cyan-950">
              {actionData.temporaryPassword}
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <Link to={`/admin/users/${actionData.user.id}`} className="btn-primary">
              Ver usuario
            </Link>
            <Link to="/admin/users" className="btn-ghost">
              Volver a usuarios
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <Breadcrumbs
        items={[
          { label: 'Panel', to: '/admin' },
          { label: 'Usuarios', to: '/admin/users' },
          { label: 'Nuevo usuario' },
        ]}
      />
      <PageHeader eyebrow="Usuarios" title="Nuevo usuario" />

      <Form method="post" className="mt-8 card space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Nombre
          </label>
          <input id="name" name="name" type="text" required className="input" />
          {actionData?.errors?.name ? (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.name}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className="label">
            Correo electrónico
          </label>
          <input id="email" name="email" type="email" required className="input" />
          {actionData?.errors?.email ? (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.email}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="role" className="label">
            Rol
          </label>
          <select
            id="role"
            name="role"
            className="input"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as UserRole.PLATFORM_ADMIN | UserRole.PROVIDER)
            }
          >
            <option value={UserRole.PROVIDER}>Prestador</option>
            <option value={UserRole.PLATFORM_ADMIN}>Administrador de plataforma</option>
          </select>
          {actionData?.errors?.role ? (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.role}</p>
          ) : null}
        </div>

        {role === UserRole.PROVIDER ? (
          <div>
            <label htmlFor="organizationId" className="label">
              Organización
            </label>
            <select id="organizationId" name="organizationId" className="input" required>
              <option value="">Selecciona una organización</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
            {organizations.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Crea una organización antes de agregar un prestador.
              </p>
            ) : null}
            {actionData?.errors?.organizationId ? (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.organizationId}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label htmlFor="password" className="label">
            Contraseña temporal
          </label>
          <input
            id="password"
            name="password"
            type="text"
            autoComplete="new-password"
            className="input"
            placeholder="Dejar en blanco para generar automáticamente"
          />
          <p className="mt-1 text-xs text-slate-500">
            Mínimo 8 caracteres si la defines manualmente. Si no, se genera una contraseña segura.
          </p>
          {actionData?.errors?.password ? (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.password}</p>
          ) : null}
        </div>

        {actionData?.errors?._form ? (
          <p className="text-sm text-red-600">{actionData.errors._form}</p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">
            Crear usuario
          </button>
          <Link to="/admin/users" className="btn-ghost">
            Cancelar
          </Link>
        </div>
      </Form>
    </div>
  );
}
