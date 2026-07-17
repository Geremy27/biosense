import 'dotenv/config';

import { ensureDefaultRecommendationPrompt } from '../app/services/recommendation-prompts.service';

async function seedRecommendationPrompt() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const prompt = await ensureDefaultRecommendationPrompt();
  console.log(`Recommendation prompt ready: ${prompt.slug} (${prompt.id})`);
  console.log(`Active: ${prompt.isActive}`);
}

seedRecommendationPrompt()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
