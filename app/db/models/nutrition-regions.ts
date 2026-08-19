import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const nutritionRegions = pgTable(
  'nutrition_regions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    // Free-text aliases for matching residencePlace when needed.
    aliases: text('aliases').array().notNull().default([]),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', {
      withTimezone: true,
      mode: 'string',
    }).$onUpdate(() => new Date().toISOString()),
  },
  (table) => [index('nutrition_regions_active_idx').on(table.active)],
);

export const nutritionLocalProducts = pgTable(
  'nutrition_local_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    regionId: uuid('region_id')
      .references(() => nutritionRegions.id)
      .notNull(),
    name: text('name').notNull(),
    role: text('role').notNull(), // 'macro' | 'micro'
    nutrients: text('nutrients').array().notNull().default([]),
    notes: text('notes'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', {
      withTimezone: true,
      mode: 'string',
    }).$onUpdate(() => new Date().toISOString()),
  },
  (table) => [
    index('nutrition_local_products_region_idx').on(table.regionId),
    index('nutrition_local_products_region_active_idx').on(table.regionId, table.active),
  ],
);
