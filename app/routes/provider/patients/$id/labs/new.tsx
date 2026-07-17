import { FileText, ShieldCheck } from 'lucide-react';
import { Form, Link, redirect, useActionData, useOutletContext } from 'react-router';

import { APP_NAME } from '~/brand';
import { FieldError } from '~/components/forms/field-error';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import {
  LabReportValidationError,
  uploadAndExtractLabReport,
} from '~/services/lab-reports.service';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/new';

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const ctx = await buildActorContext(request);

  try {
    const report = await uploadAndExtractLabReport(ctx, params.id, formData.get('pdf'));
    if (!report) {
      throw new Response('No encontrado', { status: 404 });
    }

    throw redirect(`/provider/patients/${params.id}/labs/${report.id}`);
  } catch (error) {
    if (error instanceof LabReportValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export default function NewLabReport() {
  const { patient } = useOutletContext<PatientOutletContext>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Laboratorios</p>
        <h2 className="mt-1 text-2xl font-bold text-cyan-950">Subir informe</h2>
        <p className="mt-2 text-sm text-slate-500">
          El PDF será analizado para identificar y extraer resultados de sangre, pero no se
          almacenará en {APP_NAME} por ahora.
        </p>
      </div>

      <Form method="post" encType="multipart/form-data" className="card space-y-6">
        <FormPendingFieldset className="space-y-6">
          <div className="rounded-lg border border-dashed border-cyan-300 bg-cyan-50 p-6">
            <div className="flex items-start gap-4">
              <div className="icon-container">
                <FileText className="size-5 text-cyan-600" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="pdf" className="label">
                  Informe PDF
                </label>
                <input
                  id="pdf"
                  name="pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-700 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-cyan-800"
                />
                <p className="mt-2 text-xs text-slate-500">Máximo 10 MB.</p>
                <FieldError message={actionData?.errors?.pdf} />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-cyan-600" aria-hidden />
            <p className="text-sm leading-relaxed text-slate-600">
              Los resultados extraídos no se guardarán como definitivos hasta que los revises y
              confirmes. Conserva el PDF original para comparar los valores antes de confirmar.
            </p>
          </div>

          {actionData?.errors?._form ? (
            <p className="text-sm text-red-600">{actionData.errors._form}</p>
          ) : null}

          <div className="flex gap-3">
            <SubmitButton loadingLabel="Analizando PDF…">Subir y analizar</SubmitButton>
            <Link to={`/provider/patients/${patient.id}/labs`} className="btn-ghost">
              Cancelar
            </Link>
          </div>
        </FormPendingFieldset>
      </Form>
    </div>
  );
}
