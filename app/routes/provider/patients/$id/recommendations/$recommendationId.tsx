import { AlertTriangle, CheckCircle2, Loader2, Pencil, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Form, Link, redirect, useActionData, useOutletContext } from 'react-router';

import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { SubmitButton } from '~/components/forms/submit-button';
import { RecommendationEditForm } from '~/components/recommendations/recommendation-edit-form';
import { RecommendationOutputView } from '~/components/recommendations/recommendation-output-view';
import { StatusBadge } from '~/components/ui/status-badge';
import { ClinicalRecommendationStatus } from '~/db/models/enums';
import {
  ClinicalRecommendationValidationError,
  confirmClinicalRecommendation,
  getClinicalRecommendation,
  unlockClinicalRecommendation,
  updateClinicalRecommendationEdits,
  validateRecommendationEditFormData,
} from '~/services/clinical-recommendations.service';
import { formatRecommendationStatus } from '~/utils/recommendation-display';
import { buildActorContext } from '~/utils/session.server';
import { asRecommendationOutput } from '~/validation/recommendations';

import type { PatientOutletContext } from '../patient-outlet-context';
import type { Route } from './+types/$recommendationId';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const recommendation = await getClinicalRecommendation(
    ctx,
    params.id,
    params.recommendationId,
  );

  if (!recommendation) {
    throw new Response('No encontrado', { status: 404 });
  }

  return { recommendation };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? 'confirm');
  const ctx = await buildActorContext(request);

  try {
    if (intent === 'unlock') {
      const recommendation = await unlockClinicalRecommendation(
        ctx,
        params.id,
        params.recommendationId,
      );

      if (!recommendation) {
        throw new Response('No encontrado', { status: 404 });
      }

      throw redirect(
        `/provider/patients/${params.id}/recommendations/${params.recommendationId}`,
      );
    }

    if (intent === 'save-edit') {
      const edits = validateRecommendationEditFormData(formData);
      const recommendation = await updateClinicalRecommendationEdits(
        ctx,
        params.id,
        params.recommendationId,
        edits,
      );

      if (!recommendation) {
        throw new Response('No encontrado', { status: 404 });
      }

      throw redirect(
        `/provider/patients/${params.id}/recommendations/${params.recommendationId}`,
      );
    }

    if (intent !== 'confirm') {
      throw new ClinicalRecommendationValidationError({ _form: 'Acción no válida.' });
    }

    const recommendation = await confirmClinicalRecommendation(
      ctx,
      params.id,
      params.recommendationId,
    );

    if (!recommendation) {
      throw new Response('No encontrado', { status: 404 });
    }

    throw redirect(
      `/provider/patients/${params.id}/recommendations/${params.recommendationId}`,
    );
  } catch (error) {
    if (error instanceof ClinicalRecommendationValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export default function RecommendationDetail({ loaderData, actionData }: Route.ComponentProps) {
  const { patient } = useOutletContext<PatientOutletContext>();
  const { recommendation } = loaderData;
  const output = asRecommendationOutput(recommendation.output);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={`/provider/patients/${patient.id}/recommendations`}
            className="text-sm font-semibold text-cyan-600 hover:text-cyan-800"
          >
            ← Recomendaciones
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-cyan-950">Recomendación clínica</h2>
          <p className="mt-1 text-sm text-slate-500">Modelo: {recommendation.model}</p>
        </div>
        <StatusBadge
          label={formatRecommendationStatus(recommendation.status)}
          variant={
            recommendation.status === ClinicalRecommendationStatus.CONFIRMED
              ? 'active'
              : 'inactive'
          }
        />
      </div>

      {recommendation.status === ClinicalRecommendationStatus.GENERATING ? (
        <section className="card text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-cyan-600" aria-hidden />
          <h3 className="mt-4 text-lg font-bold text-cyan-950">Generando recomendación</h3>
          <p className="mt-2 text-sm text-slate-500">
            Esto puede tomar unos momentos. Actualiza la página si el estado no cambia.
          </p>
        </section>
      ) : null}

      {recommendation.status === ClinicalRecommendationStatus.FAILED ? (
        <section className="card">
          <AlertTriangle className="size-8 text-amber-600" aria-hidden />
          <h3 className="mt-4 text-lg font-bold text-cyan-950">No se pudo generar</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {recommendation.generationError || 'Ocurrió un error al generar la recomendación.'}
          </p>
          <Link
            to={`/provider/patients/${patient.id}/recommendations/new`}
            className="btn-primary mt-6"
          >
            Intentar de nuevo
          </Link>
        </section>
      ) : null}

      {output &&
      (recommendation.status === ClinicalRecommendationStatus.PENDING_REVIEW ||
        recommendation.status === ClinicalRecommendationStatus.CONFIRMED) ? (
        <>
          {recommendation.status === ClinicalRecommendationStatus.CONFIRMED ? (
            <section className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-cyan-700" aria-hidden />
                <div>
                  <p className="font-semibold text-cyan-950">Recomendación confirmada</p>
                  <p className="mt-1 text-sm text-cyan-900">
                    Quedó bloqueada contra modificaciones. Usa "Editar" si necesitas corregirla.
                  </p>
                </div>
              </div>
              <Form method="post">
                <input type="hidden" name="intent" value="unlock" />
                <FormPendingFieldset intent="unlock">
                  <SubmitButton loadingLabel="Reabriendo…" pendingOptions={{ intent: 'unlock' }}>
                    <Pencil className="size-4" aria-hidden />
                    Editar
                  </SubmitButton>
                </FormPendingFieldset>
              </Form>
            </section>
          ) : null}

          {recommendation.status === ClinicalRecommendationStatus.PENDING_REVIEW ? (
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/provider/patients/${patient.id}/recommendations/${recommendation.id}/share`}
                className="btn-ghost gap-2"
              >
                <Share2 className="size-4" aria-hidden />
                Compartir / Imprimir
              </Link>
              {!isEditing ? (
                <button
                  type="button"
                  className="btn-ghost gap-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-4" aria-hidden />
                  Editar
                </button>
              ) : null}
            </div>
          ) : (
            <Link
              to={`/provider/patients/${patient.id}/recommendations/${recommendation.id}/share`}
              className="btn-ghost gap-2"
            >
              <Share2 className="size-4" aria-hidden />
              Compartir / Imprimir
            </Link>
          )}

          {isEditing && recommendation.status === ClinicalRecommendationStatus.PENDING_REVIEW ? (
            <RecommendationEditForm
              output={output}
              errors={actionData?.errors}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <RecommendationOutputView output={output} audience="provider" />
          )}

          {!isEditing && recommendation.status === ClinicalRecommendationStatus.PENDING_REVIEW ? (
            <Form method="post" className="card space-y-4">
              <input type="hidden" name="intent" value="confirm" />
              <FormPendingFieldset intent="confirm" className="space-y-4">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input type="checkbox" required className="mt-1 size-4" />
                  <span>
                    Revisé esta recomendación clínica. Al confirmar, quedará bloqueada.
                  </span>
                </label>
                {actionData?.errors?._form ? (
                  <p className="text-sm text-red-600">{actionData.errors._form}</p>
                ) : null}
                <SubmitButton loadingLabel="Confirmando…">Confirmar recomendación</SubmitButton>
              </FormPendingFieldset>
            </Form>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
