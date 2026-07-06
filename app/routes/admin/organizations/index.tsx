import { Building2 } from 'lucide-react';
import { Link } from 'react-router';

import { EmptyState } from '~/components/ui/empty-state';
import { PageHeader } from '~/components/ui/page-header';
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
      <PageHeader
        eyebrow="Administración"
        title="Organizaciones"
        actions={
          <Link to="/admin/organizations/new" className="btn-primary">
            Nueva organización
          </Link>
        }
      />

      {loaderData.organizations.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Building2}
            title="Aún no hay organizaciones"
            description="Crea la primera organización para vincular prestadores y pacientes."
            action={
              <Link to="/admin/organizations/new" className="btn-primary">
                Nueva organización
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 card overflow-hidden p-0">
          <table className="data-table">
            <thead className="data-table-head">
              <tr>
                <th className="data-table-th">Nombre</th>
                <th className="data-table-th">Creada</th>
                <th className="data-table-th" />
              </tr>
            </thead>
            <tbody>
              {loaderData.organizations.map((organization) => (
                <tr key={organization.id} className="data-table-row">
                  <td className="data-table-td font-medium text-cyan-950">{organization.name}</td>
                  <td className="data-table-td text-slate-500">
                    {new Date(organization.createdAt).toLocaleDateString('es-CO')}
                  </td>
                  <td className="data-table-td text-right">
                    <Link
                      to={`/admin/organizations/${organization.id}`}
                      className="font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
