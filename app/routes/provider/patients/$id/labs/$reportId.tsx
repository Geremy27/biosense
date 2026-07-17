import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Link, redirect, useOutletContext } from 'react-router';

import { LabReportReviewForm } from '~/components/labs/lab-report-review-form';
import { StatusBadge } from '~/components/ui/status-badge';
import { LabReportStatus } from '~/db/models/enums';
import {
  confirmLabReport,
  getLabReport,
  LabReportValidationError,
  validateConfirmLabReportFormData,
} from '~/services/lab-reports.service';
import { formatLabDate, formatLabReportStatus } from '~/utils/lab-display';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/$reportId';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const result = await getLabReport(ctx, params.id, params.reportId);

  if (!result) {
    throw new Response('No encontrado', { status: 404 });
  }

  return result;
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const ctx = await buildActorContext(request);

  try {
    const input = validateConfirmLabReportFormData(formData);
    const report = await confirmLabReport(ctx, params.id, params.reportId, input);
    if (!report) {
      throw new Response('No encontrado', { status: 404 });
    }

    throw redirect(`/provider/patients/${params.id}/labs/${params.reportId}`);
  } catch (error) {
    if (error instanceof LabReportValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export default function LabReportDetail({ loaderData, actionData }: Route.ComponentProps) {
  const { patient } = useOutletContext<PatientOutletContext>();
  const { report, analytes } = loaderData;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={`/provider/patients/${patient.id}/labs`}
            className="text-sm font-semibold text-cyan-600 hover:text-cyan-800"
          >
            ← Laboratorios
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-cyan-950">
            {report.panelName || report.labName || report.originalFilename}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{report.originalFilename}</p>
        </div>
        <StatusBadge
          label={formatLabReportStatus(report.status)}
          variant={report.status === LabReportStatus.CONFIRMED ? 'active' : 'inactive'}
        />
      </div>

      {report.status === LabReportStatus.FAILED ? (
        <section className="card">
          <AlertTriangle className="size-8 text-amber-600" aria-hidden />
          <h3 className="mt-4 text-lg font-bold text-cyan-950">No se pudo extraer</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {report.extractionError || 'No fue posible analizar este documento.'}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            El PDF no se conserva en Health EMR por ahora. Vuelve a subir el informe para intentar
            una nueva extracción.
          </p>
          <Link to={`/provider/patients/${patient.id}/labs/new`} className="btn-primary mt-6">
            Subir de nuevo
          </Link>
        </section>
      ) : null}

      {report.status === LabReportStatus.EXTRACTING ? (
        <section className="card text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-cyan-600" aria-hidden />
          <h3 className="mt-4 text-lg font-bold text-cyan-950">Analizando informe</h3>
          <p className="mt-2 text-sm text-slate-500">
            La extracción está en curso. Actualiza la página en unos momentos.
          </p>
        </section>
      ) : null}

      {report.status === LabReportStatus.PENDING_REVIEW ? (
        <div className="space-y-6">
          <section className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
            <div>
              <p className="font-semibold text-amber-950">PDF no almacenado</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">
                El archivo solo se usó durante la extracción y no se guardó. Compara estos valores
                contra el PDF original antes de confirmar.
              </p>
            </div>
          </section>
          <LabReportReviewForm
            patientId={patient.id}
            report={report}
            initialAnalytes={analytes}
            errors={actionData?.errors}
          />
        </div>
      ) : null}

      {report.status === LabReportStatus.CONFIRMED ? (
        <div className="space-y-6">
          <section className="flex items-start gap-3 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-cyan-700" aria-hidden />
            <div>
              <p className="font-semibold text-cyan-950">Informe confirmado</p>
              <p className="mt-1 text-sm text-cyan-900">
                Los valores fueron verificados y están bloqueados contra modificaciones.
              </p>
            </div>
          </section>

          <section className="card">
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryValue label="Laboratorio" value={report.labName || 'No indicado'} />
              <SummaryValue label="Panel" value={report.panelName || 'No indicado'} />
              <SummaryValue label="Fecha de toma" value={formatLabDate(report.collectedAt)} />
            </div>
          </section>

          <section className="card overflow-x-auto p-0">
            <table className="data-table">
              <thead className="data-table-head">
                <tr>
                  <th>Parámetro</th>
                  <th>Valor</th>
                  <th>Unidad</th>
                  <th>Referencia</th>
                  <th>Óptimo</th>
                  <th>Indicador</th>
                </tr>
              </thead>
              <tbody>
                {analytes.map((analyte) => (
                  <tr key={analyte.id} className="data-table-row">
                    <td className="data-table-td font-semibold text-cyan-950">{analyte.name}</td>
                    <td className="data-table-td">{analyte.value}</td>
                    <td className="data-table-td">{analyte.unit || '—'}</td>
                    <td className="data-table-td">{analyte.referenceRange || '—'}</td>
                    <td className="data-table-td">{analyte.optimalRange || '—'}</td>
                    <td className="data-table-td">{analyte.flag || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-cyan-950">{value}</dd>
    </div>
  );
}
