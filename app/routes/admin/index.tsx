import { Building2, Users } from 'lucide-react';
import { pageTitle } from '~/brand';
import { PageHeader } from '~/components/ui/page-header';
import { StatCard } from '~/components/ui/stat-card';
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
  return [{ title: pageTitle('Panel') }];
}

export default function AdminHome({ loaderData }: Route.ComponentProps) {
  return (
    <div className="w-full max-w-6xl">
      <PageHeader
        eyebrow="Panel"
        title="Bienvenido al área de administración"
        description="Has iniciado sesión como administrador de plataforma. Los prestadores acceden por su propio portal en /provider."
        headingLevel="h1"
      />

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <StatCard
          label="Organizaciones"
          value={loaderData.organizationsCount}
          to="/admin/organizations"
          icon={Building2}
        />
        <StatCard
          label="Prestadores"
          value={loaderData.providersCount}
          to="/admin/users?role=provider"
          icon={Users}
        />
      </div>
    </div>
  );
}
