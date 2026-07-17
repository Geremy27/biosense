import { Calendar, Users } from 'lucide-react';
import { pageTitle } from '~/brand';
import { PageHeader } from '~/components/ui/page-header';
import { StatCard } from '~/components/ui/stat-card';
import { listPatients } from '~/services/patients.service';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/index';

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const patients = await listPatients(ctx);

  return {
    patientsCount: patients.length,
  };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: pageTitle('Panel') }];
}

export default function ProviderHome({ loaderData }: Route.ComponentProps) {
  return (
    <div className="w-full max-w-6xl">
      <PageHeader
        eyebrow="Panel"
        title="Bienvenido a tu consultorio"
        description="Gestiona tus pacientes y consultas desde este panel. Más funciones llegarán pronto."
        headingLevel="h1"
      />

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <StatCard
          label="Pacientes"
          value={loaderData.patientsCount}
          to="/provider/patients"
          icon={Users}
        />
        <StatCard label="Consultas" value="—" icon={Calendar} comingSoon />
      </div>
    </div>
  );
}
