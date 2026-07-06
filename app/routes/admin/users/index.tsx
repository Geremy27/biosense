import { Link, useSearchParams } from 'react-router';

import { UserRole } from '~/db/models/enums';
import { listUsers, type UserListFilter } from '~/services/users.service';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/index';

const FILTERS: { value: UserListFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: UserRole.PLATFORM_ADMIN, label: 'Administradores' },
  { value: UserRole.PROVIDER, label: 'Prestadores' },
];

// Formats a user role for display in the admin table.
function formatRole(role: UserRole) {
  if (role === UserRole.PLATFORM_ADMIN) {
    return 'Administrador';
  }

  if (role === UserRole.PROVIDER) {
    return 'Prestador';
  }

  return role;
}

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
  return [{ title: 'Usuarios — Health EMR' }];
}

export default function UsersIndex({ loaderData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Administración</p>
          <h2 className="text-3xl font-bold tracking-tight text-cyan-950">Usuarios</h2>
        </div>
        <Link to="/admin/users/new" className="btn-primary">
          Nuevo usuario
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const params = new URLSearchParams(searchParams);
          if (filter.value === 'all') {
            params.delete('role');
          } else {
            params.set('role', filter.value);
          }

          const href = params.toString() ? `?${params.toString()}` : '/admin/users';
          const isActive = loaderData.filter === filter.value;

          return (
            <Link
              key={filter.value}
              to={href}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                isActive
                  ? 'bg-cyan-50 text-cyan-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-cyan-950'
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 card overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-semibold">Nombre</th>
              <th className="px-6 py-3 font-semibold">Correo</th>
              <th className="px-6 py-3 font-semibold">Rol</th>
              <th className="px-6 py-3 font-semibold">Organización</th>
              <th className="px-6 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {loaderData.users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-slate-500">
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : (
              loaderData.users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-4 font-medium text-cyan-950">{user.name}</td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-slate-600">{formatRole(user.role)}</td>
                  <td className="px-6 py-4 text-slate-600">{user.organizationName ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/admin/users/${user.id}`}
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
