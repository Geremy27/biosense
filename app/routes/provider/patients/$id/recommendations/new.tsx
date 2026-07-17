import { Lightbulb, Sparkles } from 'lucide-react';
import { Form, Link, redirect, useActionData, useOutletContext } from 'react-router';

import { FieldError } from '~/components/forms/field-error';
import { FormField } from '~/components/forms/form-field';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import { LabReportStatus } from '~/db/models/enums';
import {
  ClinicalRecommendationValidationError,
  generateClinicalRecommendation,
  validateGenerateRecommendationFormData,
} from '~/services/clinical-recommendations.service';
import { listLabReports } from '~/services/lab-reports.service';
import {
  DEFAULT_RECOMMENDATION_SYSTEM_PROMPT,
  DEFAULT_RECOMMENDATION_USER_PROMPT_TEMPLATE,
} from '~/services/recommendation-prompt-defaults';
import { formatLabDate } from '~/utils/lab-display';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/new';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const reports = await listLabReports(ctx, params.id);

  return {
    confirmedLabs: reports.filter((report) => report.status === LabReportStatus.CONFIRMED),
    defaultSystemPrompt: DEFAULT_RECOMMENDATION_SYSTEM_PROMPT,
    defaultUserPromptTemplate: DEFAULT_RECOMMENDATION_USER_PROMPT_TEMPLATE,
    defaultModel: process.env.OPENAI_MODEL ?? 'gpt-4o',
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const ctx = await buildActorContext(request);

  try {
    const input = validateGenerateRecommendationFormData(formData);
    const recommendation = await generateClinicalRecommendation(ctx, params.id, input);

    if (!recommendation) {
      throw new Response('No encontrado', { status: 404 });
    }

    throw redirect(`/provider/patients/${params.id}/recommendations/${recommendation.id}`);
  } catch (error) {
    if (error instanceof ClinicalRecommendationValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export default function NewRecommendation({ loaderData }: Route.ComponentProps) {
  const { patient } = useOutletContext<PatientOutletContext>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/provider/patients/${patient.id}/recommendations`}
          className="text-sm font-semibold text-cyan-600 hover:text-cyan-800"
        >
          ← Recomendaciones
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-cyan-950">Generar recomendación</h2>
        <p className="mt-2 text-sm text-slate-500">
          Edita el prompt libremente para experimentar. El texto usado queda guardado en la
          recomendación.
        </p>
      </div>

      {loaderData.confirmedLabs.length === 0 ? (
        <section className="card">
          <Sparkles className="size-8 text-cyan-600" aria-hidden />
          <h3 className="mt-4 text-lg font-bold text-cyan-950">Necesitas un laboratorio confirmado</h3>
          <p className="mt-2 text-sm text-slate-500">
            Confirma primero un informe de laboratorio para basar la recomendación.
          </p>
          <Link to={`/provider/patients/${patient.id}/labs`} className="btn-primary mt-6">
            Ir a laboratorios
          </Link>
        </section>
      ) : (
        <Form method="post" className="card space-y-6">
          <FormPendingFieldset className="space-y-6">
            <FormField id="labReportId" label="Laboratorio base">
              <select
                id="labReportId"
                name="labReportId"
                className="input"
                required
                defaultValue=""
              >
                <option value="">Selecciona un laboratorio confirmado</option>
                {loaderData.confirmedLabs.map((report) => (
                  <option key={report.id} value={report.id}>
                    {(report.panelName || report.labName || report.originalFilename) +
                      ` — ${formatLabDate(report.collectedAt)}`}
                  </option>
                ))}
              </select>
              <FieldError message={actionData?.errors?.labReportId} />
            </FormField>

            <FormField id="medicationsText" label="Medicación y suplementos actuales">
              <textarea
                id="medicationsText"
                name="medicationsText"
                rows={4}
                className="input"
                placeholder="Ej: Magnesio 200 mg noche; Vitamina D 2000 UI diaria; Losartán 50 mg"
              />
              <p className="mt-2 text-xs text-slate-500">
                Texto libre por ahora. Se inyecta en el prompt como {'{{medications_json}}'}.
              </p>
              <FieldError message={actionData?.errors?.medicationsText} />
            </FormField>

            <FormField id="model" label="Modelo">
              <input
                id="model"
                name="model"
                className="input"
                defaultValue={loaderData.defaultModel}
              />
              <FieldError message={actionData?.errors?.model} />
            </FormField>

            <FormField id="systemPrompt" label="System prompt">
              <textarea
                id="systemPrompt"
                name="systemPrompt"
                rows={8}
                className="input font-mono text-sm"
                required
                defaultValue={loaderData.defaultSystemPrompt}
              />
              <FieldError message={actionData?.errors?.systemPrompt} />
            </FormField>

            <FormField id="userPromptTemplate" label="User prompt">
              <textarea
                id="userPromptTemplate"
                name="userPromptTemplate"
                rows={16}
                className="input font-mono text-sm"
                required
                defaultValue={loaderData.defaultUserPromptTemplate}
              />
              <p className="mt-2 text-xs text-slate-500">
                Placeholders: {'{{patient_json}}'}, {'{{medications_json}}'}, {'{{collected_at}}'},{' '}
                {'{{analytes_json}}'}.
              </p>
              <FieldError message={actionData?.errors?.userPromptTemplate} />
            </FormField>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-cyan-600" aria-hidden />
              <p className="text-sm leading-relaxed text-slate-600">
                No se envían nombre, documento ni datos de contacto. Solo edad, sexo, medidas y
                valores del laboratorio seleccionado.
              </p>
            </div>

            {actionData?.errors?._form ? (
              <p className="text-sm text-red-600">{actionData.errors._form}</p>
            ) : null}

            <div className="flex gap-3">
              <SubmitButton loadingLabel="Generando…">Generar recomendación</SubmitButton>
              <Link
                to={`/provider/patients/${patient.id}/recommendations`}
                className="btn-ghost"
              >
                Cancelar
              </Link>
            </div>
          </FormPendingFieldset>
        </Form>
      )}
    </div>
  );
}
