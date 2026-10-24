export const ifmCalorieTierValues = ['1200-1400', '1400-1800', '1800-2200'] as const;
export type IfmCalorieTier = (typeof ifmCalorieTierValues)[number];

export const ifmPlanKeyValues = [
  'core',
  'core_vegan',
  'core_vegetarian',
  'cardiometabolic',
  'mito',
  'detox',
  'elimination',
  'low_fodmap',
  'anti_candida',
] as const;
export type IfmPlanKey = (typeof ifmPlanKeyValues)[number];

export type IfmPlanDocument = {
  key: IfmPlanKey;
  displayName: string;
  supportsCalorieTiers: boolean;
  mapsToDietType: string;
  documents: Partial<Record<'default' | IfmCalorieTier, string>>;
};

export type IfmFoodPlanBundle = {
  version: number;
  sourceFingerprint: string;
  generatedAt?: string;
  featuresText: string;
  macronutrientsText: string;
  phytonutrientText: string;
  plans: Record<IfmPlanKey, IfmPlanDocument>;
};

export type IfmFoodPlanSelection = {
  planKey: IfmPlanKey;
  calorieTier: IfmCalorieTier | null;
  rationale: string;
};
