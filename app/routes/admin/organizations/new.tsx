import { Form, Link, redirect, useActionData } from 'react-router';

import { createOrganization } from '~/services/organizations.service';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/new';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const ctx = await buildActorContext(request);

  if (!name) {
    return { errors: { name: 'El nombre es obligatorio.' } };
  }

  const organization = await createOrganization(ctx, { name });
  throw redirect(`/admin/organizations/${organization.id}`);
}

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Nueva organización — Health EMR' }];
}

export default function NewOrganization() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-xl">
      <p className="eyebrow">Organizaciones</p>
      <h2 className="text-3xl font-bold tracking-tight text-cyan-950">Nueva organización</h2>

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

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">
            Crear organización
          </button>
          <Link to="/admin/organizations" className="btn-ghost">
            Cancelar
          </Link>
        </div>
      </Form>
    </div>
  );
}
