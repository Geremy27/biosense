import { and, desc, eq, ne } from 'drizzle-orm';

import { db } from '..';
import { recommendationPrompts } from '../models/recommendation-prompts';

type RecommendationPromptRow = typeof recommendationPrompts.$inferSelect;
type NewRecommendationPrompt = typeof recommendationPrompts.$inferInsert;

export async function findRecommendationPrompts() {
  return db.select().from(recommendationPrompts).orderBy(desc(recommendationPrompts.createdAt));
}

export async function findActiveRecommendationPrompts() {
  return db
    .select()
    .from(recommendationPrompts)
    .where(eq(recommendationPrompts.isActive, true))
    .orderBy(desc(recommendationPrompts.createdAt));
}

export async function findRecommendationPromptById(id: string) {
  const [row] = await db
    .select()
    .from(recommendationPrompts)
    .where(eq(recommendationPrompts.id, id))
    .limit(1);

  return row ?? null;
}

export async function findRecommendationPromptBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(recommendationPrompts)
    .where(eq(recommendationPrompts.slug, slug))
    .limit(1);

  return row ?? null;
}

export async function insertRecommendationPrompt(
  data: NewRecommendationPrompt,
): Promise<RecommendationPromptRow> {
  const [row] = await db.insert(recommendationPrompts).values(data).returning();

  if (!row) {
    throw new Error('Failed to insert recommendation prompt');
  }

  return row;
}

export async function updateRecommendationPrompt(
  id: string,
  data: Partial<
    Pick<
      RecommendationPromptRow,
      | 'name'
      | 'systemPrompt'
      | 'userPromptTemplate'
      | 'outputSchemaVersion'
      | 'model'
      | 'isActive'
    >
  >,
): Promise<RecommendationPromptRow | null> {
  return db.transaction(async (tx) => {
    if (data.isActive === true) {
      await tx
        .update(recommendationPrompts)
        .set({ isActive: false })
        .where(and(eq(recommendationPrompts.isActive, true), ne(recommendationPrompts.id, id)));
    }

    const [row] = await tx
      .update(recommendationPrompts)
      .set(data)
      .where(eq(recommendationPrompts.id, id))
      .returning();

    return row ?? null;
  });
}
