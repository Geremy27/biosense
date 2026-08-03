import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { Form, Link, redirect, useActionData, useOutletContext } from 'react-router';

import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import { MedicalHistoryForm } from '~/components/medical-history/medical-history-form';
import { MedicalHistorySummary } from '~/components/medical-history/medical-history-summary';
import { StatusBadge } from '~/components/ui/status-badge';
import { MedicalHistoryStatus } from '~/db/models/enums';
import {
  confirmMedicalHistoryById,
  deleteMedicalHistoryById,
  getMedicalHistory,
  MedicalHistoryValidationError,
  updateMedicalHistoryById,
  validateConfirmMedicalHistoryFormData,
  validateMedicalHistoryFormData,
} from '~/services/patient-medical-histories.service';
import {
  formatMedicalHistoryDate,
  formatMedicalHistoryStatus,
  medicalHistoryStatusBadgeVariant,
} from '~/utils/medical-history-display';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/$historyId';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const medicalHistory = await getMedicalHistory(ctx, params.id, params.historyId);

  if (!medicalHistory) {
    throw new Response('No encontrado', { status: 404 });
  }

  return { medicalHistory };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? 'update');
  const ctx = await buildActorContext(request);

  if (intent === 'delete') {
    const deleted = await deleteMedicalHistoryById(ctx, params.id, params.historyId);

    if (!deleted) {
      throw new Response('No encontrado', { status: 404 });
    }

    throw redirect(`/provider/patients/${params.id}/medical-histories`);
  }

  if (intent === 'confirm') {
    try {
      validateConfirmMedicalHistoryFormData(formData);
      await confirmMedicalHistoryById(ctx, params.id, params.historyId);
      return { ok: true, confirmed: true };
    } catch (error) {
      if (error instanceof MedicalHistoryValidationError) {
        return { errors: error.fieldErrors };
      }

      throw error;
    }
  }

  try {
    const input = validateMedicalHistoryFormData(formData);
    const row = await updateMedicalHistoryById(ctx, params.id, params.historyId, input);

    if (!row) {
      throw new Response('No encontrado', { status: 404 });
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof MedicalHistoryValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export default function MedicalHistoryDetail({ loaderData }: Route.ComponentProps) {
  const { patient } = useOutletContext<PatientOutletContext>();
  const actionData = useActionData<typeof action>();
  const { medicalHistory } = loaderData;
  const { status } = medicalHistory;
  const isConfirmed = status === MedicalHistoryStatus.CONFIRMED;
  const isDraft = status === MedicalHistoryStatus.DRAFT;
  const isFailed = status === MedicalHistoryStatus.FAILED;
  const isExtracting = status === MedicalHistoryStatus.EXTRACTING;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={`/provider/patients/${patient.id}/medical-histories`}
            className="text-sm font-semibold text-cyan-600 hover:text-cyan-800"
          >
            ← Historial
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-cyan-950">{medicalHistory.title}</h2>
          <p className="mt-2 text-sm text-slate-500">
            Registro clínico del {formatMedicalHistoryDate(medicalHistory.recordedAt)}.
          </p>
        </div>
        <StatusBadge
          label={formatMedicalHistoryStatus(status)}
          variant={medicalHistoryStatusBadgeVariant(status)}
        />
      </div>

      {isConfirmed ? (
        <section className="flex items-start gap-3 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-cyan-700" aria-hidden />
          <div>
            <p className="font-semibold text-cyan-950">Antecedente confirmado</p>
            <p className="mt-1 text-sm text-cyan-900">
              Por ley, este registro quedó bloqueado y no puede editarse ni eliminarse. Registra
              una nueva entrada si necesitas actualizar la historia clínica.
            </p>
          </div>
        </section>
      ) : null}

      {actionData?.ok && !actionData.confirmed ? (
        <p className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
          Antecedentes actualizados.
        </p>
      ) : null}

      {isExtracting ? (
        <section className="card text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-cyan-600" aria-hidden />
          <h3 className="mt-4 text-lg font-bold text-cyan-950">Analizando PDF</h3>
          <p className="mt-2 text-sm text-slate-500">
            Esto puede tomar unos momentos. Actualiza la página si el estado no cambia.
          </p>
        </section>
      ) : null}

      {isFailed ? (
        <section className="card">
          <AlertTriangle className="size-8 text-amber-600" aria-hidden />
          <h3 className="mt-4 text-lg font-bold text-cyan-950">No se pudo extraer el PDF</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {medicalHistory.extractionError ||
              'Ocurrió un error al analizar el documento.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/provider/patients/${patient.id}/medical-histories/new-from-pdf`}
              className="btn-primary"
            >
              Intentar con otro PDF
            </Link>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <FormPendingFieldset intent="delete">
                <SubmitButton loadingLabel="Eliminando…" variant="danger" pendingOptions={{ intent: 'delete' }}>
                  Descartar registro
                </SubmitButton>
              </FormPendingFieldset>
            </Form>
          </div>
        </section>
      ) : null}

      {isConfirmed ? (
        <div className="card">
          <MedicalHistorySummary medicalHistory={medicalHistory} />
        </div>
      ) : null}

      {isDraft ? (
        <>
          <Form method="post" className="card space-y-6">
            <MedicalHistoryForm
              submitLabel="Guardar cambios"
              cancelTo={`/provider/patients/${patient.id}/medical-histories`}
              errors={actionData?.errors}
              patientSex={patient.sex}
              defaultValues={medicalHistory}
            />
          </Form>

          <Form method="post" className="card space-y-4 border border-amber-200 bg-amber-50">
            <input type="hidden" name="intent" value="confirm" />
            <FormPendingFieldset intent="confirm" className="space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
                <div>
                  <h3 className="font-bold text-amber-950">Confirmar antecedente</h3>
                  <p className="mt-1 text-sm text-amber-900">
                    Por ley, un antecedente clínico confirmado no puede editarse ni eliminarse en
                    el futuro. Revisa la información con el paciente antes de confirmar.
                  </p>
                </div>
              </div>
              <label className="flex items-start gap-3 text-sm text-amber-950">
                <input type="checkbox" name="acknowledged" required className="mt-1 size-4" />
                <span>
                  Confirmo que revisé esta información con el paciente y entiendo que, una vez
                  confirmada, este antecedente no podrá editarse ni eliminarse en el futuro.
                </span>
              </label>
              {actionData?.errors?._form ? (
                <p className="text-sm text-red-600">{actionData.errors._form}</p>
              ) : null}
              <SubmitButton loadingLabel="Confirmando…" pendingOptions={{ intent: 'confirm' }}>
                Confirmar antecedente
              </SubmitButton>
            </FormPendingFieldset>
          </Form>

          <Form method="post" className="card border border-red-100">
            <input type="hidden" name="intent" value="delete" />
            <FormPendingFieldset intent="delete">
              <h3 className="font-bold text-cyan-950">Eliminar registro</h3>
              <p className="mt-2 text-sm text-slate-500">
                Eliminación reversible. El registro dejará de aparecer en el listado y en nuevas
                recomendaciones.
              </p>
              <SubmitButton
                loadingLabel="Eliminando…"
                variant="danger"
                className="mt-4"
                pendingOptions={{ intent: 'delete' }}
              >
                Eliminar
              </SubmitButton>
            </FormPendingFieldset>
          </Form>
        </>
      ) : null}
    </div>
  );
}
