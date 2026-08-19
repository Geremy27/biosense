import { Form, redirect, useActionData, useOutletContext } from 'react-router';

import { PatientForm } from '~/components/patients/patient-form';
import { SubmitButton } from '~/components/forms/submit-button';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { listActiveNutritionRegions } from '~/db/repositories';
import {
  deletePatient,
  PatientValidationError,
  updatePatientById,
  validatePatientFormData,
} from '~/services/patients.service';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from './patient-outlet-context';
import type { Route } from './+types/edit';

export async function loader() {
  const nutritionRegions = await listActiveNutritionRegions();
  return { nutritionRegions };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? 'update');
  const ctx = await buildActorContext(request);

  if (intent === 'delete') {
    const deleted = await deletePatient(ctx, params.id);

    if (!deleted) {
      throw new Response('No encontrado', { status: 404 });
    }

    throw redirect('/provider/patients');
  }

  try {
    const input = validatePatientFormData(formData);
    const patient = await updatePatientById(ctx, params.id, input);

    if (!patient) {
      throw new Response('No encontrado', { status: 404 });
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof PatientValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export default function EditPatient({ loaderData }: Route.ComponentProps) {
  const { patient } = useOutletContext<PatientOutletContext>();
  const actionData = useActionData<typeof action>();

  return (
    <>
      {actionData?.ok ? (
        <p className="mb-6 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
          Paciente actualizado.
        </p>
      ) : null}

      <PatientForm
        submitLabel="Guardar cambios"
        cancelTo={`/provider/patients/${patient.id}`}
        errors={actionData?.errors}
        nutritionRegions={loaderData.nutritionRegions}
        defaultValues={{
          identificationType: patient.identificationType,
          identificationNumber: patient.identificationNumber,
          firstName: patient.firstName,
          secondName: patient.secondName,
          firstLastName: patient.firstLastName,
          secondLastName: patient.secondLastName,
          birthDate: patient.birthDate,
          birthPlace: patient.birthPlace,
          residencePlace: patient.residencePlace,
          residenceRegionId: patient.residenceRegionId ?? undefined,
          phone: patient.phone,
          email: patient.email,
          sex: patient.sex,
          ethnicity: patient.ethnicity,
          heightCm: patient.heightCm,
          weightKg: patient.weightKg,
        }}
      />

      <Form method="post" className="mt-8 card border border-red-100">
        <input type="hidden" name="intent" value="delete" />
        <FormPendingFieldset intent="delete">
        <h3 className="font-bold text-cyan-950">Desactivar paciente</h3>
        <p className="mt-2 text-sm text-slate-500">
          Desactiva este paciente de forma reversible. El historial clínico se conservará.
        </p>
        <SubmitButton loadingLabel="Desactivando…" variant="danger" className="mt-4" pendingOptions={{ intent: 'delete' }}>
          Desactivar
        </SubmitButton>
        </FormPendingFieldset>
      </Form>
    </>
  );
}
