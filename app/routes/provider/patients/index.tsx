import { Link } from 'react-router';
import { Users } from 'lucide-react';

import { EmptyState } from '~/components/ui/empty-state';
import { PageHeader } from '~/components/ui/page-header';
import { listPatients } from '~/services/patients.service';
import { buildActorContext } from '~/utils/session.server';
import {
  formatIdentificationType,
  formatPatientName,
} from '~/utils/patient-display';

import type { Route } from './+types/index';

export async function loader({ request }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const patients = await listPatients(ctx);

  return { patients };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Pacientes — Health EMR' }];
}

export default function PatientsIndex({ loaderData }: Route.ComponentProps) {
  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Consultorio"
        title="Pacientes"
        actions={
          <Link to="/provider/patients/new" className="btn-primary">
            Nuevo paciente
          </Link>
        }
      />

      {loaderData.patients.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="Aún no tienes pacientes registrados"
            description="Registra tu primer paciente para comenzar a gestionar su información clínica."
            action={
              <Link to="/provider/patients/new" className="btn-primary">
                Registrar primer paciente
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
                <th className="data-table-th">Identificación</th>
                <th className="data-table-th">Teléfono</th>
                <th className="data-table-th">Nacimiento</th>
                <th className="data-table-th" />
              </tr>
            </thead>
            <tbody>
              {loaderData.patients.map((patient) => (
                <tr key={patient.id} className="data-table-row">
                  <td className="data-table-td font-medium text-cyan-950">
                    {formatPatientName(patient)}
                  </td>
                  <td className="data-table-td text-slate-600">
                    {formatIdentificationType(patient.identificationType)}{' '}
                    {patient.identificationNumber}
                  </td>
                  <td className="data-table-td text-slate-600">{patient.phone}</td>
                  <td className="data-table-td text-slate-600">
                    {new Date(`${patient.birthDate}T00:00:00`).toLocaleDateString('es-CO')}
                  </td>
                  <td className="data-table-td text-right">
                    <Link
                      to={`/provider/patients/${patient.id}`}
                      className="font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                      Ver
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
