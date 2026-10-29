import type { IfmFoodPlanBundle } from './types';
import bundleData from './food-plans.bundle.json';

export function loadIfmFoodPlanBundle(): IfmFoodPlanBundle {
  return bundleData as IfmFoodPlanBundle;
}
