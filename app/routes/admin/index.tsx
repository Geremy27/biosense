import { Link } from 'react-router';

import { buildActorContext } from '~/utils/session.server';
import { listOrganizations } from '~/services/organizations.service';
import { listProviders } from '~/services/providers.service';

import type { Route } from './+types/index';

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const [organizations, providers] = await Promise.all([
    listOrganizations(ctx),
    listProviders(ctx),
  ]);

  return {
    organizationsCount: organizations.length,
    providersCount: providers.length,
  };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Panel — Health EMR' }];
}

export default function AdminHome({ loaderData }: Route.ComponentProps) {
  return (
    <div className="w-full max-w-6xl">
      <div className="card-elevated">
        <p className="eyebrow mb-4">Panel</p>
        <h2 className="text-3xl font-bold tracking-tight text-cyan-950">
          Bienvenido al área de administración
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
          Has iniciado sesión como administrador de plataforma. Esta área está aislada del portal
          de prestadores, que tendrá su propia ruta cuando lo construyamos.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Link to="/admin/organizations" className="card transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-500">Organizaciones</p>
          <p className="mt-2 text-4xl font-bold text-cyan-950">{loaderData.organizationsCount}</p>
        </Link>
        <Link to="/admin/users?role=provider" className="card transition-shadow hover:shadow-md">
          <p className="text-sm font-semibold text-slate-500">Prestadores</p>
          <p className="mt-2 text-4xl font-bold text-cyan-950">{loaderData.providersCount}</p>
        </Link>
      </div>
    </div>
  );
}
