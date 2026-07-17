import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

import {
  recommendationOutputSchema,
  type RecommendationOutput,
} from '~/validation/recommendations';

export type RecommendationGenerationInput = {
  systemPrompt: string;
  userPrompt: string;
  model: string;
};

export async function generateRecommendationOutput({
  systemPrompt,
  userPrompt,
  model,
}: RecommendationGenerationInput): Promise<RecommendationOutput & { model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const client = new OpenAI({ apiKey });
  const response = await client.responses.parse({
    model,
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    text: {
      format: zodTextFormat(recommendationOutputSchema, 'clinical_recommendation'),
    },
  });

  if (!response.output_parsed) {
    throw new Error('The model did not return structured recommendation data');
  }

  return { ...response.output_parsed, model };
}
