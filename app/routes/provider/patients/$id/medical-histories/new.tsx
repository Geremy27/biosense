import { Form, Link, redirect, useActionData, useOutletContext } from 'react-router';

import { MedicalHistoryForm } from '~/components/medical-history/medical-history-form';
import {
  createMedicalHistory,
  MedicalHistoryValidationError,
  validateMedicalHistoryFormData,
} from '~/services/patient-medical-histories.service';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/new';

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

export default function NewMedicalHistory() {
  const { patient } = useOutletContext<PatientOutletContext>();
  const actionData = useActionData<typeof action>();

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
      </div>

      <Form method="post" className="card space-y-6">
        <MedicalHistoryForm
          submitLabel="Guardar antecedentes"
          cancelTo={`/provider/patients/${patient.id}/medical-histories`}
          errors={actionData?.errors}
          patientSex={patient.sex}
        />
      </Form>
    </div>
  );
}
