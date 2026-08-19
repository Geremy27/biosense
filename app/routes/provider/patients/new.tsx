import { redirect, useActionData } from 'react-router';

import { pageTitle } from '~/brand';
import { PatientForm } from '~/components/patients/patient-form';
import { Breadcrumbs } from '~/components/ui/breadcrumbs';
import { PageHeader } from '~/components/ui/page-header';
import { listActiveNutritionRegions } from '~/db/repositories';
import {
  createPatient,
  PatientValidationError,
  validatePatientFormData,
} from '~/services/patients.service';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/new';

export async function loader() {
  const nutritionRegions = await listActiveNutritionRegions();
  return { nutritionRegions };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const ctx = await buildActorContext(request);

  try {
    const input = validatePatientFormData(formData);
    const patient = await createPatient(ctx, input);
    throw redirect(`/provider/patients/${patient.id}`);
  } catch (error) {
    if (error instanceof PatientValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export function meta({}: Route.MetaArgs) {
  return [{ title: pageTitle('Nuevo paciente') }];
}

export default function NewPatient({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();

  return (
    <div className="w-full max-w-3xl">
      <Breadcrumbs
        items={[
          { label: 'Panel', to: '/provider' },
          { label: 'Pacientes', to: '/provider/patients' },
          { label: 'Nuevo paciente' },
        ]}
      />
      <PageHeader eyebrow="Pacientes" title="Nuevo paciente" />

      <div className="mt-8">
        <PatientForm
          submitLabel="Crear paciente"
          cancelTo="/provider/patients"
          errors={actionData?.errors}
          nutritionRegions={loaderData.nutritionRegions}
        />
      </div>
    </div>
  );
}
