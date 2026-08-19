import { Form, Link, redirect, useActionData, useOutletContext } from 'react-router';

import { MedicalHistoryForm } from '~/components/medical-history/medical-history-form';
import {
  createMedicalHistory,
  getMedicalHistoryPrefillDefaults,
  MedicalHistoryValidationError,
  validateMedicalHistoryFormData,
} from '~/services/patient-medical-histories.service';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/new';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const defaults = await getMedicalHistoryPrefillDefaults(ctx, params.id);
  return { defaults };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const ctx = await buildActorContext(request);

  try {
    const input = validateMedicalHistoryFormData(formData);
    const row = await createMedicalHistory(ctx, params.id, input);
    throw redirect(`/provider/patients/${params.id}/medical-histories/${row.id}`);
  } catch (error) {
    if (error instanceof MedicalHistoryValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export default function NewMedicalHistory({ loaderData }: Route.ComponentProps) {
  const { patient } = useOutletContext<PatientOutletContext>();
  const actionData = useActionData<typeof action>();
  const { defaults } = loaderData;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/provider/patients/${patient.id}/medical-histories`}
          className="text-sm font-semibold text-cyan-600 hover:text-cyan-800"
        >
          ← Historial
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-cyan-950">Nuevo registro de historial</h2>
        <p className="mt-2 text-sm text-slate-500">
          Captura historia clínica, hábitos y medicación para usarla en recomendaciones.
        </p>
        {defaults.prefilledFromId ? (
          <p className="mt-2 rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
            Se prellenó con el historial anterior. Revisa y actualiza fechas o ítems que hayan
            cambiado.
          </p>
        ) : null}
      </div>

      <Form method="post" className="card space-y-6">
        <MedicalHistoryForm
          submitLabel="Guardar antecedentes"
          cancelTo={`/provider/patients/${patient.id}/medical-histories`}
          errors={actionData?.errors}
          defaultValues={defaults}
          patientSex={patient.sex}
        />
      </Form>
    </div>
  );
}
