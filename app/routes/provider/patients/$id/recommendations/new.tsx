import { Lightbulb, Sparkles } from 'lucide-react';
import { Form, Link, redirect, useActionData, useOutletContext } from 'react-router';

import { FieldError } from '~/components/forms/field-error';
import { FormField } from '~/components/forms/form-field';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import { LabReportStatus, MedicalHistoryStatus } from '~/db/models/enums';
import {
  ClinicalRecommendationValidationError,
  generateClinicalRecommendation,
  validateGenerateRecommendationFormData,
} from '~/services/clinical-recommendations.service';
import { listMedicalHistories } from '~/services/patient-medical-histories.service';
import { listLabReports } from '~/services/lab-reports.service';
import {
  DEFAULT_RECOMMENDATION_INSTRUCTIONS,
  DEFAULT_RECOMMENDATION_SYSTEM_PROMPT,
} from '~/services/recommendation-prompt-defaults';
import { formatMedicalHistoryDate } from '~/utils/medical-history-display';
import { formatLabDate } from '~/utils/lab-display';
import { buildActorContext } from '~/utils/session.server';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/new';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const [reports, medicalHistories] = await Promise.all([
    listLabReports(ctx, params.id),
    listMedicalHistories(ctx, params.id),
  ]);

  return {
    confirmedLabs: reports.filter((report) => report.status === LabReportStatus.CONFIRMED),
    medicalHistories: medicalHistories.filter(
      (row) =>
        row.status === MedicalHistoryStatus.DRAFT ||
        row.status === MedicalHistoryStatus.CONFIRMED,
    ),
    defaultSystemPrompt: DEFAULT_RECOMMENDATION_SYSTEM_PROMPT,
    defaultInstructions: DEFAULT_RECOMMENDATION_INSTRUCTIONS,
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
          Los datos clínicos (paciente, antecedentes y laboratorio) se envían automáticamente.
          Aquí solo editas las instrucciones para el modelo.
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

            <FormField id="medicalHistoryId" label="Antecedentes clínicos">
              <select
                id="medicalHistoryId"
                name="medicalHistoryId"
                className="input"
                defaultValue={loaderData.medicalHistories[0]?.id ?? ''}
              >
                <option value="">Sin antecedentes (opcional)</option>
                {loaderData.medicalHistories.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title} — {formatMedicalHistoryDate(row.recordedAt)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Se incluyen en el contexto del modelo. Puedes crearlos en la pestaña Historial.
              </p>
              <FieldError message={actionData?.errors?.medicalHistoryId} />
            </FormField>

            <FormField id="medicationsText" label="Medicación y suplementos (opcional)">
              <textarea
                id="medicationsText"
                name="medicationsText"
                rows={3}
                className="input"
                placeholder="Si lo dejas vacío, se usa la medicación de los antecedentes seleccionados."
              />
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

            <FormField id="instructions" label="Instrucciones">
              <textarea
                id="instructions"
                name="instructions"
                rows={18}
                className="input font-mono text-sm"
                required
                defaultValue={loaderData.defaultInstructions}
              />
              <p className="mt-2 text-xs text-slate-500">
                Solo instrucciones clínicas. Demografía, antecedentes, medicación y analitos se
                agregan automáticamente en código.
              </p>
              <FieldError message={actionData?.errors?.instructions} />
            </FormField>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-cyan-600" aria-hidden />
              <p className="text-sm leading-relaxed text-slate-600">
                No se envían nombre, documento ni datos de contacto. Solo edad, sexo, medidas,
                antecedentes seleccionados y valores del laboratorio.
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
