import { Form, redirect, useActionData, useLoaderData } from 'react-router';

import { Breadcrumbs } from '~/components/ui/breadcrumbs';
import { PageHeader } from '~/components/ui/page-header';
import { FormActions } from '~/components/forms/form-actions';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import {
  deleteOrganization,
  getOrganization,
  updateOrganizationById,
} from '~/services/organizations.service';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/$id';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const organization = await getOrganization(ctx, params.id);

  if (!organization) {
    throw new Response('No encontrado', { status: 404 });
  }

  return { organization };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? 'update');
  const ctx = await buildActorContext(request);

  if (intent === 'delete') {
    await deleteOrganization(ctx, params.id);
    throw redirect('/admin/organizations');
  }

  const name = String(formData.get('name') ?? '').trim();

  if (!name) {
    return { errors: { name: 'El nombre es obligatorio.' } };
  }

  const organization = await updateOrganizationById(ctx, params.id, { name });

  if (!organization) {
    throw new Response('No encontrado', { status: 404 });
  }

  return { ok: true };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData.organization.name} — Health EMR` }];
}

export default function EditOrganization() {
  const { organization } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-xl">
      <Breadcrumbs
        items={[
          { label: 'Panel', to: '/admin' },
          { label: 'Organizaciones', to: '/admin/organizations' },
          { label: organization.name },
        ]}
      />
      <PageHeader eyebrow="Organizaciones" title={organization.name} />

      {actionData?.ok ? (
        <p className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
          Organización actualizada.
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
            defaultValue={organization.name}
            className="input"
          />
          {actionData?.errors?.name ? (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.name}</p>
          ) : null}
        </div>

        <FormActions
          submitLabel="Guardar cambios"
          loadingLabel="Guardando…"
          cancelTo="/admin/organizations"
          cancelLabel="Volver"
          intent="update"
        />
        </FormPendingFieldset>
      </Form>

      <Form method="post" className="mt-8 card border border-red-100">
        <input type="hidden" name="intent" value="delete" />
        <FormPendingFieldset intent="delete">
        <h3 className="font-bold text-cyan-950">Desactivar organización</h3>
        <p className="mt-2 text-sm text-slate-500">
          Desactiva esta organización de forma reversible. Revisa primero los prestadores
          vinculados.
        </p>
        <SubmitButton loadingLabel="Desactivando…" variant="danger" className="mt-4" pendingOptions={{ intent: 'delete' }}>
          Desactivar
        </SubmitButton>
        </FormPendingFieldset>
      </Form>
    </div>
  );
}
