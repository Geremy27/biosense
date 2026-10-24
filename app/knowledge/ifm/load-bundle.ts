import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IfmFoodPlanBundle } from './types';

let cachedBundle: IfmFoodPlanBundle | null = null;

export function loadIfmFoodPlanBundle(): IfmFoodPlanBundle {
  if (cachedBundle) {
    return cachedBundle;
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const path = join(here, 'food-plans.bundle.json');
  const raw = readFileSync(path, 'utf8');
  cachedBundle = JSON.parse(raw) as IfmFoodPlanBundle;
  return cachedBundle;
}
