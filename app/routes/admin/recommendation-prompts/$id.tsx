import { Form, Link, redirect, useActionData } from 'react-router';

import { pageTitle } from '~/brand';
import { FieldError } from '~/components/forms/field-error';
import { FormActions } from '~/components/forms/form-actions';
import { FormField } from '~/components/forms/form-field';
import { FormPendingFieldset } from '~/components/forms/form-pending-fieldset';
import { Breadcrumbs } from '~/components/ui/breadcrumbs';
import { PageHeader } from '~/components/ui/page-header';
import {
  getRecommendationPrompt,
  RecommendationPromptValidationError,
  updateRecommendationPromptById,
  validateRecommendationPromptFormData,
} from '~/services/recommendation-prompts.service';
import { buildActorContext } from '~/utils/session.server';

import type { Route } from './+types/$id';

export async function loader({ request, params }: Route.LoaderArgs) {
  const ctx = await buildActorContext(request);
  const prompt = await getRecommendationPrompt(ctx, params.id);

  if (!prompt) {
    throw new Response('No encontrado', { status: 404 });
  }

  return { prompt };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const ctx = await buildActorContext(request);

  try {
    const input = validateRecommendationPromptFormData(formData);
    const prompt = await updateRecommendationPromptById(ctx, params.id, input);

    if (!prompt) {
      throw new Response('No encontrado', { status: 404 });
    }

    throw redirect('/admin/recommendation-prompts');
  } catch (error) {
    if (error instanceof RecommendationPromptValidationError) {
      return { errors: error.fieldErrors };
    }

    throw error;
  }
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: pageTitle(loaderData?.prompt.name ?? 'Prompt') }];
}

export default function EditRecommendationPrompt({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { prompt } = loaderData;

  return (
    <div className="w-full max-w-4xl">
      <Breadcrumbs
        items={[
          { label: 'Panel', to: '/admin' },
          { label: 'Prompts', to: '/admin/recommendation-prompts' },
          { label: prompt.name },
        ]}
      />
      <PageHeader eyebrow="Administración" title={`Editar: ${prompt.name}`} />

      <Form method="post" className="mt-8 card space-y-6">
        <FormPendingFieldset className="space-y-6">
          <p className="text-sm text-slate-500">
            Slug: <span className="font-semibold text-cyan-950">{prompt.slug}</span>. Este texto son
            solo las instrucciones clínicas; demografía, antecedentes y laboratorio se inyectan
            automáticamente al generar.
          </p>

          <FormField id="name" label="Nombre">
            <input
              id="name"
              name="name"
              className="input"
              required
              defaultValue={prompt.name}
            />
            <FieldError message={actionData?.errors?.name} />
          </FormField>

          <FormField id="model" label="Modelo">
            <input
              id="model"
              name="model"
              className="input"
              required
              defaultValue={prompt.model}
            />
            <FieldError message={actionData?.errors?.model} />
          </FormField>

          <FormField id="systemPrompt" label="System prompt">
            <textarea
              id="systemPrompt"
              name="systemPrompt"
              className="input min-h-40 font-mono text-sm"
              required
              defaultValue={prompt.systemPrompt}
            />
            <FieldError message={actionData?.errors?.systemPrompt} />
          </FormField>

          <FormField id="userPromptTemplate" label="Instrucciones">
            <textarea
              id="userPromptTemplate"
              name="userPromptTemplate"
              className="input min-h-64 font-mono text-sm"
              required
              defaultValue={prompt.userPromptTemplate}
            />
            <FieldError message={actionData?.errors?.userPromptTemplate} />
          </FormField>

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={prompt.isActive}
              className="size-4"
            />
            Marcar como prompt activo por defecto
          </label>

          {actionData?.errors?._form ? (
            <p className="text-sm text-red-600">{actionData.errors._form}</p>
          ) : null}

          <FormActions
            submitLabel="Guardar prompt"
            loadingLabel="Guardando…"
            cancelTo="/admin/recommendation-prompts"
          />
        </FormPendingFieldset>
      </Form>

      <p className="mt-4 text-sm text-slate-500">
        <Link to="/admin/recommendation-prompts" className="font-semibold text-cyan-600">
          Volver al listado
        </Link>
      </p>
    </div>
  );
}
