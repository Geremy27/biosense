import { and, asc, eq } from 'drizzle-orm';

import { db } from '..';
import { nutritionLocalProducts, nutritionRegions } from '../models/nutrition-regions';

export async function listActiveNutritionRegions() {
  return db
    .select({
      id: nutritionRegions.id,
      name: nutritionRegions.name,
    })
    .from(nutritionRegions)
    .where(eq(nutritionRegions.active, true))
    .orderBy(asc(nutritionRegions.name));
}

export async function findNutritionRegionById(id: string) {
  const [row] = await db
    .select()
    .from(nutritionRegions)
    .where(and(eq(nutritionRegions.id, id), eq(nutritionRegions.active, true)))
    .limit(1);

  return row ?? null;
}

export async function listActiveLocalProductsByRegionId(regionId: string) {
  return db
    .select({
      id: nutritionLocalProducts.id,
      name: nutritionLocalProducts.name,
      role: nutritionLocalProducts.role,
      nutrients: nutritionLocalProducts.nutrients,
      notes: nutritionLocalProducts.notes,
    })
    .from(nutritionLocalProducts)
    .where(
      and(
        eq(nutritionLocalProducts.regionId, regionId),
        eq(nutritionLocalProducts.active, true),
      ),
    )
    .orderBy(asc(nutritionLocalProducts.role), asc(nutritionLocalProducts.name));
}
