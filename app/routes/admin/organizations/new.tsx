import { Form, redirect, useActionData } from 'react-router';

import { pageTitle } from '~/brand';
import { Breadcrumbs } from '~/components/ui/breadcrumbs';
import { PageHeader } from '~/components/ui/page-header';
import { FormActions } from '~/components/forms/form-actions';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { OrganizationType } from '~/db/models/enums';
import { createOrganization } from '~/services/organizations.service';
import { ORGANIZATION_TYPE_OPTIONS } from '~/utils/organization-display';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/new';

function parseOrganizationType(value: string): OrganizationType | null {
  if (value === OrganizationType.PERSONA_NATURAL || value === OrganizationType.PERSONA_JURIDICA) {
    return value;
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const type = parseOrganizationType(String(formData.get('type') ?? ''));
  const ctx = await buildActorContext(request);

  const errors: { name?: string; type?: string } = {};

  if (!name) {
    errors.name = 'El nombre es obligatorio.';
  }

  if (!type) {
    errors.type = 'El tipo de persona es obligatorio.';
  }

  if (errors.name || errors.type || !type) {
    return { errors };
  }

  const organization = await createOrganization(ctx, { name, type });
  throw redirect(`/admin/organizations/${organization.id}`);
}

export function meta({}: Route.MetaArgs) {
  return [{ title: pageTitle('Nueva organización') }];
}

export default function NewOrganization() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-xl">
      <Breadcrumbs
        items={[
          { label: 'Panel', to: '/admin' },
          { label: 'Organizaciones', to: '/admin/organizations' },
          { label: 'Nueva organización' },
        ]}
      />
      <PageHeader eyebrow="Organizaciones" title="Nueva organización" />

      <Form method="post" className="mt-8 card space-y-4">
        <FormPendingFieldset className="space-y-4">
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
          <label htmlFor="type" className="label">
            Tipo de persona
          </label>
          <select id="type" name="type" required className="input" defaultValue="">
            <option value="" disabled>
              Selecciona un tipo
            </option>
            {ORGANIZATION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {actionData?.errors?.type ? (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.type}</p>
          ) : null}
        </div>

        <FormActions
          submitLabel="Crear organización"
          loadingLabel="Creando…"
          cancelTo="/admin/organizations"
        />
        </FormPendingFieldset>
      </Form>
    </div>
  );
}
