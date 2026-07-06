import { Link } from 'react-router';

import { listOrganizations } from '~/services/organizations.service';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/index';

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const organizations = await listOrganizations(ctx);

  return { organizations };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Organizaciones — Health EMR' }];
}

export default function OrganizationsIndex({ loaderData }: Route.ComponentProps) {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Administración</p>
          <h2 className="text-3xl font-bold tracking-tight text-cyan-950">Organizaciones</h2>
        </div>
        <Link to="/admin/organizations/new" className="btn-primary">
          Nueva organización
        </Link>
      </div>

      <div className="mt-8 card overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-semibold">Nombre</th>
              <th className="px-6 py-3 font-semibold">Creada</th>
              <th className="px-6 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loaderData.organizations.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-slate-500">
                  Aún no hay organizaciones.
                </td>
              </tr>
            ) : (
              loaderData.organizations.map((organization) => (
                <tr key={organization.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-4 font-medium text-cyan-950">{organization.name}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(organization.createdAt).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/admin/organizations/${organization.id}`}
                      className="font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
