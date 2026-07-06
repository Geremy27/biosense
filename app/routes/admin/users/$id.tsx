import { useState } from 'react';
import { Form, redirect, useActionData, useLoaderData } from 'react-router';

import { Breadcrumbs } from '~/components/ui/breadcrumbs';
import { PageHeader } from '~/components/ui/page-header';
import { FormActions } from '~/components/forms/form-actions';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import { UserRole } from '~/db/models/enums';
import { listOrganizations } from '~/services/organizations.service';
import { deleteUser, getUser, updateUserById, UserValidationError } from '~/services/users.service';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/$id';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const [user, organizations] = await Promise.all([
    getUser(ctx, params.id),
    listOrganizations(ctx),
  ]);

  if (!user) {
    throw new Response('No encontrado', { status: 404 });
  }

  if (user.role !== UserRole.PLATFORM_ADMIN && user.role !== UserRole.PROVIDER) {
    throw new Response('No encontrado', { status: 404 });
  }

  return { user, organizations };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? 'update');
  const ctx = await buildActorContext(request);

  if (intent === 'delete') {
    try {
      await deleteUser(ctx, params.id);
      throw redirect('/admin/users');
    } catch (error) {
      if (error instanceof UserValidationError) {
        return { errors: error.fieldErrors };
      }

      throw error;
    }
  }

  const role = String(formData.get('role') ?? '');

  try {
    const user = await updateUserById(ctx, params.id, {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      role: role as UserRole.PLATFORM_ADMIN | UserRole.PROVIDER,
      organizationId: String(formData.get('organizationId') ?? '') || null,
      password: String(formData.get('password') ?? '') || null,
    });

    if (!user) {
      throw new Response('No encontrado', { status: 404 });
    }

    return { ok: true, passwordUpdated: Boolean(String(formData.get('password') ?? '').trim()) };
  } catch (error) {
    if (error instanceof UserValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData.user.name} — Health EMR` }];
}

export default function EditUser() {
  const { user, organizations } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [role, setRole] = useState<UserRole.PLATFORM_ADMIN | UserRole.PROVIDER>(
    user.role as UserRole.PLATFORM_ADMIN | UserRole.PROVIDER,
  );

  return (
    <div className="max-w-xl">
      <Breadcrumbs
        items={[
          { label: 'Panel', to: '/admin' },
          { label: 'Usuarios', to: '/admin/users' },
          { label: user.name },
        ]}
      />
      <PageHeader eyebrow="Usuarios" title={user.name} />

      {actionData?.ok ? (
        <p className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
          {actionData.passwordUpdated
            ? 'Usuario actualizado y contraseña restablecida.'
            : 'Usuario actualizado.'}
        </p>
      ) : null}

      <Form method="post" className="mt-8 card space-y-4">
        <input type="hidden" name="intent" value="update" />

        <FormPendingFieldset className="space-y-4" intent="update">

        <div>
          <label htmlFor="name" className="label">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={user.name}
            className="input"
          />
          {actionData?.errors?.name ? (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.name}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className="label">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={user.email}
            className="input"
          />
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
            <select
              id="organizationId"
              name="organizationId"
              className="input"
              required
              defaultValue={user.organizationId ?? ''}
            >
              <option value="">Selecciona una organización</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
            {actionData?.errors?.organizationId ? (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.organizationId}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label htmlFor="password" className="label">
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="text"
            autoComplete="new-password"
            className="input"
            placeholder="Dejar en blanco para mantener la actual"
          />
          <p className="mt-1 text-xs text-slate-500">
            Define una nueva contraseña temporal solo al restablecer el acceso.
          </p>
          {actionData?.errors?.password ? (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.password}</p>
          ) : null}
        </div>

        {actionData?.errors?._form ? (
          <p className="text-sm text-red-600">{actionData.errors._form}</p>
        ) : null}

        <FormActions
          submitLabel="Guardar cambios"
          loadingLabel="Guardando…"
          cancelTo="/admin/users"
          cancelLabel="Volver"
          intent="update"
        />
        </FormPendingFieldset>
      </Form>

      <Form method="post" className="mt-8 card border border-red-100">
        <input type="hidden" name="intent" value="delete" />
        <FormPendingFieldset intent="delete">
        <h3 className="font-bold text-cyan-950">Desactivar usuario</h3>
        <p className="mt-2 text-sm text-slate-500">
          Desactiva esta cuenta de forma reversible y elimina el acceso activo como prestador.
        </p>
        <SubmitButton loadingLabel="Desactivando…" variant="danger" className="mt-4" pendingOptions={{ intent: 'delete' }}>
          Desactivar
        </SubmitButton>
        </FormPendingFieldset>
      </Form>
    </div>
  );
}
