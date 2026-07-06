import { Outlet } from 'react-router';

import { PatientSubNav } from '~/components/patients/patient-sub-nav';
import { Breadcrumbs } from '~/components/ui/breadcrumbs';
import { PageHeader } from '~/components/ui/page-header';
import { getPatient } from '~/services/patients.service';
import { buildActorContext } from '~/utils/session.server';
import { formatPatientName } from '~/utils/patient-display';

import type { Route } from './+types/_layout';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const patient = await getPatient(ctx, params.id);

  if (!patient) {
    throw new Response('No encontrado', { status: 404 });
  }

  return { patient };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${formatPatientName(loaderData.patient)} — Health EMR` }];
}

export default function PatientLayout({ loaderData }: Route.ComponentProps) {
  const patientName = formatPatientName(loaderData.patient);

  return (
    <div className="w-full max-w-4xl">
      <Breadcrumbs
        items={[
          { label: 'Panel', to: '/provider' },
          { label: 'Pacientes', to: '/provider/patients' },
          { label: patientName },
        ]}
      />
      <PageHeader eyebrow="Pacientes" title={patientName} />
      <PatientSubNav patientId={loaderData.patient.id} />
      <div className="mt-8">
        <Outlet context={{ patient: loaderData.patient }} />
      </div>
    </div>
  );
}
