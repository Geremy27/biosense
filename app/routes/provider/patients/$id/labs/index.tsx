import { FileUp, FlaskConical } from 'lucide-react';
import { Link, useOutletContext } from 'react-router';

import { EmptyState } from '~/components/ui/empty-state';
import { StatusBadge } from '~/components/ui/status-badge';
import { LabReportStatus } from '~/db/models/enums';
import { listLabReports } from '~/services/lab-reports.service';
import {
  formatLabDate,
  formatLabReportStatus,
  formatLabUploadDate,
} from '~/utils/lab-display';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/index';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  return { reports: await listLabReports(ctx, params.id) };
}

export default function PatientLabs({ loaderData }: Route.ComponentProps) {
  const { patient } = useOutletContext<PatientOutletContext>();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Historia clínica</p>
          <h2 className="mt-1 text-2xl font-bold text-cyan-950">Laboratorios</h2>
          <p className="mt-2 text-sm text-slate-500">
            Informes de sangre extraídos y confirmados por el prestador.
          </p>
        </div>
        <Link to="new" className="btn-primary gap-2">
          <FileUp className="size-4" aria-hidden />
          Subir PDF
        </Link>
      </div>

      {loaderData.reports.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No hay laboratorios"
          description="Sube el primer informe PDF para extraer sus resultados."
          action={
            <Link to="new" className="btn-primary">
              Subir informe
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="data-table">
            <thead className="data-table-head">
              <tr>
                <th>Informe</th>
                <th>Fecha de toma</th>
                <th>Subido</th>
                <th>Estado</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loaderData.reports.map((report) => (
                <tr key={report.id} className="data-table-row">
                  <td className="data-table-td">
                    <p className="font-semibold text-cyan-950">
                      {report.panelName || report.labName || report.originalFilename}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{report.originalFilename}</p>
                  </td>
                  <td className="data-table-td">{formatLabDate(report.collectedAt)}</td>
                  <td className="data-table-td">{formatLabUploadDate(report.createdAt)}</td>
                  <td className="data-table-td">
                    <StatusBadge
                      label={formatLabReportStatus(report.status)}
                      variant={
                        report.status === LabReportStatus.CONFIRMED ? 'active' : 'inactive'
                      }
                    />
                  </td>
                  <td className="data-table-td text-right">
                    <Link
                      to={`/provider/patients/${patient.id}/labs/${report.id}`}
                      className="font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                      {report.status === LabReportStatus.PENDING_REVIEW ? 'Revisar' : 'Ver'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
