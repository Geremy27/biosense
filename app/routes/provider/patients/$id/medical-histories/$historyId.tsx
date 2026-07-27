import { Form, Link, redirect, useActionData, useOutletContext } from 'react-router';

import { MedicalHistoryForm } from '~/components/medical-history/medical-history-form';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import {
  deleteMedicalHistoryById,
  getMedicalHistory,
  MedicalHistoryValidationError,
  updateMedicalHistoryById,
  validateMedicalHistoryFormData,
} from '~/services/patient-medical-histories.service';
import { formatMedicalHistoryDate } from '~/utils/medical-history-display';
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

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/provider/patients/${patient.id}/medical-histories`}
          className="text-sm font-semibold text-cyan-600 hover:text-cyan-800"
        >
          ← Antecedentes
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-cyan-950">{medicalHistory.title}</h2>
        <p className="mt-2 text-sm text-slate-500">
          Registro clínico del {formatMedicalHistoryDate(medicalHistory.recordedAt)}.
        </p>
      </div>

      {actionData?.ok ? (
        <p className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
          Antecedentes actualizados.
        </p>
      ) : null}

      <Form method="post" className="card space-y-6">
        <MedicalHistoryForm
          submitLabel="Guardar cambios"
          cancelTo={`/provider/patients/${patient.id}/medical-histories`}
          errors={actionData?.errors}
          defaultValues={{
            title: medicalHistory.title,
            recordedAt: medicalHistory.recordedAt,
            chiefComplaint: medicalHistory.chiefComplaint,
            personalHistory: medicalHistory.personalHistory,
            familyHistory: medicalHistory.familyHistory,
            surgicalHistory: medicalHistory.surgicalHistory,
            allergies: medicalHistory.allergies,
            medicationsAndSupplements: medicalHistory.medicationsAndSupplements,
            habitsLifestyle: medicalHistory.habitsLifestyle,
            notes: medicalHistory.notes,
          }}
        />
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
    </div>
  );
}
