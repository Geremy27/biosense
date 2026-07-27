import { ClipboardPlus, NotebookPen } from 'lucide-react';
import { Link, useOutletContext } from 'react-router';

import { EmptyState } from '~/components/ui/empty-state';
import { listMedicalHistories } from '~/services/patient-medical-histories.service';
import {
  formatMedicalHistoryCreatedAt,
  formatMedicalHistoryDate,
} from '~/utils/medical-history-display';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/index';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  return { medicalHistories: await listMedicalHistories(ctx, params.id) };
}

export default function PatientMedicalHistories({ loaderData }: Route.ComponentProps) {
  const { patient } = useOutletContext<PatientOutletContext>();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Historia clínica</p>
          <h2 className="mt-1 text-2xl font-bold text-cyan-950">Antecedentes</h2>
          <p className="mt-2 text-sm text-slate-500">
            Historia clínica estructurada para contextualizar laboratorios y recomendaciones.
          </p>
        </div>
        <Link to="new" className="btn-primary gap-2">
          <ClipboardPlus className="size-4" aria-hidden />
          Nuevo registro
        </Link>
      </div>

      {loaderData.medicalHistories.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No hay antecedentes"
          description="Registra el primer set de antecedentes clínicos del paciente."
          action={
            <Link to="new" className="btn-primary">
              Crear antecedentes
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="data-table">
            <thead className="data-table-head">
              <tr>
                <th className="data-table-th">Registro</th>
                <th className="data-table-th">Fecha clínica</th>
                <th className="data-table-th">Creado</th>
                <th className="data-table-th text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loaderData.medicalHistories.map((row) => (
                <tr key={row.id} className="data-table-row">
                  <td className="data-table-td">
                    <p className="font-semibold text-cyan-950">{row.title}</p>
                    {row.chiefComplaint ? (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {row.chiefComplaint}
                      </p>
                    ) : null}
                  </td>
                  <td className="data-table-td">{formatMedicalHistoryDate(row.recordedAt)}</td>
                  <td className="data-table-td">{formatMedicalHistoryCreatedAt(row.createdAt)}</td>
                  <td className="data-table-td text-right">
                    <Link
                      to={`/provider/patients/${patient.id}/medical-histories/${row.id}`}
                      className="font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                      Ver / Editar
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
