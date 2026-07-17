import { Link, useSearchParams } from 'react-router';

import { pageTitle } from '~/brand';
import { UserRole } from '~/db/models/enums';
import { EmptyState } from '~/components/ui/empty-state';
import { FilterTabs } from '~/components/ui/filter-tabs';
import { PageHeader } from '~/components/ui/page-header';
import { RoleBadge } from '~/components/ui/status-badge';
import { listUsers, type UserListFilter } from '~/services/users.service';
import { buildActorContext } from '~/utils/session.server';
import { Users } from 'lucide-react';

import type { Route } from './+types/index';

const FILTERS: { value: UserListFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: UserRole.PLATFORM_ADMIN, label: 'Administradores' },
  { value: UserRole.PROVIDER, label: 'Prestadores' },
];

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const url = new URL(request.url);
  const roleParam = url.searchParams.get('role');
  const filter: UserListFilter =
    roleParam === UserRole.PLATFORM_ADMIN || roleParam === UserRole.PROVIDER ? roleParam : 'all';

  const users = await listUsers(ctx, filter);

  return { users, filter };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: pageTitle('Usuarios') }];
}

export default function UsersIndex({ loaderData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();

  const filterTabs = FILTERS.map((filter) => {
    const params = new URLSearchParams(searchParams);
    if (filter.value === 'all') {
      params.delete('role');
    } else {
      params.set('role', filter.value);
    }

    const href = params.toString() ? `?${params.toString()}` : '/admin/users';

    return {
      label: filter.label,
      href,
      isActive: loaderData.filter === filter.value,
    };
  });

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        actions={
          <Link to="/admin/users/new" className="btn-primary">
            Nuevo usuario
          </Link>
        }
      />

      <FilterTabs tabs={filterTabs} />

      {loaderData.users.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="No se encontraron usuarios"
            description="Crea el primer usuario para comenzar a gestionar el acceso a la plataforma."
            action={
              <Link to="/admin/users/new" className="btn-primary">
                Nuevo usuario
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
                <th className="data-table-th">Correo</th>
                <th className="data-table-th">Rol</th>
                <th className="data-table-th">Organización</th>
                <th className="data-table-th" />
              </tr>
            </thead>
            <tbody>
              {loaderData.users.map((user) => (
                <tr key={user.id} className="data-table-row">
                  <td className="data-table-td font-medium text-cyan-950">{user.name}</td>
                  <td className="data-table-td text-slate-600">{user.email}</td>
                  <td className="data-table-td">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="data-table-td text-slate-600">{user.organizationName ?? '—'}</td>
                  <td className="data-table-td text-right">
                    <Link
                      to={`/admin/users/${user.id}`}
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
