import { AuditAction } from '~/db/models/enums';
import {
  findRecommendationPromptById,
  findRecommendationPrompts,
  findRecommendationPromptBySlug,
  insertRecommendationPrompt,
  updateRecommendationPrompt,
} from '~/db/repositories';
import {
  DEFAULT_RECOMMENDATION_INSTRUCTIONS,
  DEFAULT_RECOMMENDATION_PROMPT_SLUG,
  DEFAULT_RECOMMENDATION_SYSTEM_PROMPT,
} from '~/services/recommendation-prompt-defaults';
import {
  parseRecommendationPromptFormData,
  type RecommendationPromptInput,
} from '~/validation/recommendations';
import { zodFieldErrors } from '~/validation/zod-errors';

import { record } from './audit.service';
import { assertPlatformAdmin, assertProvider } from './authz';
import type { ActorContext } from './context';

export class RecommendationPromptValidationError extends Error {
  fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super('Validation failed');
    this.name = 'RecommendationPromptValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export async function listRecommendationPrompts(ctx: ActorContext) {
  assertPlatformAdmin(ctx);
  const rows = await findRecommendationPrompts();

  await record(ctx, {
    action: AuditAction.LIST,
    entityType: 'recommendation_prompt',
    metadata: { count: rows.length },
  });

  return rows;
}

export async function listActiveRecommendationPromptsForProvider(ctx: ActorContext) {
  assertProvider(ctx);
  const rows = await findRecommendationPrompts();
  const active = rows.filter((row) => row.isActive);

  await record(ctx, {
    action: AuditAction.LIST,
    entityType: 'recommendation_prompt',
    metadata: { count: active.length, scope: 'active_for_provider' },
  });

  return active.length > 0 ? active : rows;
}

export async function getRecommendationPrompt(ctx: ActorContext, id: string) {
  assertPlatformAdmin(ctx);
  const row = await findRecommendationPromptById(id);

  await record(ctx, {
    action: AuditAction.VIEW,
    entityType: 'recommendation_prompt',
    entityId: id,
    metadata: { found: row !== null },
  });

  return row;
}

export async function updateRecommendationPromptById(
  ctx: ActorContext,
  id: string,
  input: RecommendationPromptInput,
) {
  assertPlatformAdmin(ctx);

  const row = await updateRecommendationPrompt(id, {
    name: input.name,
    systemPrompt: input.systemPrompt,
    userPromptTemplate: input.userPromptTemplate,
    model: input.model,
    isActive: input.isActive,
  });

  await record(ctx, {
    action: AuditAction.UPDATE,
    entityType: 'recommendation_prompt',
    entityId: id,
    metadata: { isActive: input.isActive },
  });

  return row;
}

export function validateRecommendationPromptFormData(formData: FormData) {
  const result = parseRecommendationPromptFormData(formData);

  if (!result.success) {
    throw new RecommendationPromptValidationError(zodFieldErrors(result.error));
  }

  return result.data;
}

export async function ensureDefaultRecommendationPrompt(createdByUserId?: string | null) {
  const existing = await findRecommendationPromptBySlug(DEFAULT_RECOMMENDATION_PROMPT_SLUG);
  if (existing) {
    return existing;
  }

  return insertRecommendationPrompt({
    slug: DEFAULT_RECOMMENDATION_PROMPT_SLUG,
    name: 'Medicina funcional y longevidad v3',
    systemPrompt: DEFAULT_RECOMMENDATION_SYSTEM_PROMPT,
    userPromptTemplate: DEFAULT_RECOMMENDATION_INSTRUCTIONS,
    outputSchemaVersion: 3,
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    isActive: true,
    createdByUserId: createdByUserId ?? null,
  });
}
