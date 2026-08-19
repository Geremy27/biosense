-- Nutrition catalog
CREATE TABLE "nutrition_regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"aliases" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nutrition_local_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"nutrients" text[] DEFAULT '{}' NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "nutrition_local_products" ADD CONSTRAINT "nutrition_local_products_region_id_nutrition_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."nutrition_regions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "nutrition_regions_active_idx" ON "nutrition_regions" USING btree ("active");
--> statement-breakpoint
CREATE INDEX "nutrition_local_products_region_idx" ON "nutrition_local_products" USING btree ("region_id");
--> statement-breakpoint
CREATE INDEX "nutrition_local_products_region_active_idx" ON "nutrition_local_products" USING btree ("region_id","active");
--> statement-breakpoint

-- Patient residence region
ALTER TABLE "patients" ADD COLUMN "residence_region_id" uuid;
--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_residence_region_id_nutrition_regions_id_fk" FOREIGN KEY ("residence_region_id") REFERENCES "public"."nutrition_regions"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Lab reports ↔ medical history (nullable for legacy rows)
ALTER TABLE "lab_reports" ADD COLUMN "medical_history_id" uuid;
--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_medical_history_id_patient_medical_histories_id_fk" FOREIGN KEY ("medical_history_id") REFERENCES "public"."patient_medical_histories"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lab_reports_medical_history_idx" ON "lab_reports" USING btree ("medical_history_id");
--> statement-breakpoint

-- Drop unused legacy free-text columns
ALTER TABLE "patient_medical_histories" DROP COLUMN IF EXISTS "personal_history";
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" DROP COLUMN IF EXISTS "medications_and_supplements";
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" DROP COLUMN IF EXISTS "habits_lifestyle";
--> statement-breakpoint

-- Convert dated clinical fields from text → jsonb arrays (MVP reset-friendly)
ALTER TABLE "patient_medical_histories" DROP COLUMN IF EXISTS "personal_history_1";
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" DROP COLUMN IF EXISTS "personal_history_2";
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" DROP COLUMN IF EXISTS "surgical_history";
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" DROP COLUMN IF EXISTS "medications";
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" DROP COLUMN IF EXISTS "supplements";
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" DROP COLUMN IF EXISTS "toxicological_history";
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "personal_history_1" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "personal_history_2" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "surgical_history" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "medications" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "supplements" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "diet" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "toxicological_history" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint

-- Seed Colombia-oriented nutrition regions + local products
WITH regions AS (
  INSERT INTO "nutrition_regions" ("id", "name", "aliases")
  VALUES
    ('11111111-1111-1111-1111-111111111101', 'Bogotá', ARRAY['bogota', 'bogotá', 'cundinamarca']),
    ('11111111-1111-1111-1111-111111111102', 'Medellín', ARRAY['medellin', 'medellín', 'antioquia']),
    ('11111111-1111-1111-1111-111111111103', 'Cali', ARRAY['cali', 'valle', 'valle del cauca']),
    ('11111111-1111-1111-1111-111111111104', 'Barranquilla', ARRAY['barranquilla', 'atlantico', 'atlántico', 'caribe']),
    ('11111111-1111-1111-1111-111111111105', 'Bucaramanga', ARRAY['bucaramanga', 'santander']),
    ('11111111-1111-1111-1111-111111111106', 'Otra región de Colombia', ARRAY['colombia', 'otro'])
  RETURNING id, name
)
INSERT INTO "nutrition_local_products" ("region_id", "name", "role", "nutrients", "notes")
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Quinua de altiplano', 'macro', ARRAY['proteina', 'fibra', 'hierro'], 'Cereales andinos disponibles en mercados de Bogotá'),
  ('11111111-1111-1111-1111-111111111101', 'Habichuela / fríjol verde', 'macro', ARRAY['fibra', 'carbohidratos'], NULL),
  ('11111111-1111-1111-1111-111111111101', 'Uchuva', 'micro', ARRAY['vitamina_c', 'carotenoides'], 'Fruta local de clima frío'),
  ('11111111-1111-1111-1111-111111111101', 'Espinaca / acelga de sabana', 'micro', ARRAY['hierro', 'folato', 'magnesio'], NULL),
  ('11111111-1111-1111-1111-111111111101', 'Huevos criollos', 'macro', ARRAY['proteina', 'grasa'], NULL),
  ('11111111-1111-1111-1111-111111111101', 'Aguacate Hass', 'macro', ARRAY['grasa', 'fibra', 'potasio'], NULL),
  ('11111111-1111-1111-1111-111111111102', 'Plátano hartón', 'macro', ARRAY['carbohidratos', 'potasio'], 'Base energética antioqueña'),
  ('11111111-1111-1111-1111-111111111102', 'Fríjol cargamanto', 'macro', ARRAY['proteina', 'fibra', 'hierro'], NULL),
  ('11111111-1111-1111-1111-111111111102', 'Aguacate antioqueño', 'macro', ARRAY['grasa', 'fibra'], NULL),
  ('11111111-1111-1111-1111-111111111102', 'Tomate de árbol', 'micro', ARRAY['vitamina_c', 'carotenoides'], NULL),
  ('11111111-1111-1111-1111-111111111102', 'Mora de Castilla', 'micro', ARRAY['vitamina_c', 'polifenoles'], NULL),
  ('11111111-1111-1111-1111-111111111102', 'Queso campesino', 'macro', ARRAY['proteina', 'grasa', 'calcio'], NULL),
  ('11111111-1111-1111-1111-111111111103', 'Pescado de río (bocachico/tilapia)', 'macro', ARRAY['proteina', 'omega3'], NULL),
  ('11111111-1111-1111-1111-111111111103', 'Chontaduro', 'macro', ARRAY['carbohidratos', 'fibra', 'vitamina_a'], 'Fruto amazónico/pacífico disponible en Cali'),
  ('11111111-1111-1111-1111-111111111103', 'Lulo', 'micro', ARRAY['vitamina_c'], NULL),
  ('11111111-1111-1111-1111-111111111103', 'Guanábana', 'micro', ARRAY['vitamina_c', 'fibra'], NULL),
  ('11111111-1111-1111-1111-111111111103', 'Coco', 'macro', ARRAY['grasa'], NULL),
  ('11111111-1111-1111-1111-111111111104', 'Pescado blanco del Caribe', 'macro', ARRAY['proteina', 'omega3', 'yodo'], NULL),
  ('11111111-1111-1111-1111-111111111104', 'Yuca', 'macro', ARRAY['carbohidratos'], NULL),
  ('11111111-1111-1111-1111-111111111104', 'Mango', 'micro', ARRAY['vitamina_a', 'vitamina_c'], NULL),
  ('11111111-1111-1111-1111-111111111104', 'Coco fresco', 'macro', ARRAY['grasa', 'fibra'], NULL),
  ('11111111-1111-1111-1111-111111111104', 'Ñame', 'macro', ARRAY['carbohidratos', 'fibra'], NULL),
  ('11111111-1111-1111-1111-111111111105', 'Cabrito / carne magra local', 'macro', ARRAY['proteina', 'hierro'], NULL),
  ('11111111-1111-1111-1111-111111111105', 'Guayaba', 'micro', ARRAY['vitamina_c'], NULL),
  ('11111111-1111-1111-1111-111111111105', 'Pitahaya', 'micro', ARRAY['fibra', 'vitamina_c'], NULL),
  ('11111111-1111-1111-1111-111111111105', 'Maíz y arepa de maíz', 'macro', ARRAY['carbohidratos', 'fibra'], 'Preferir versiones integrales / sin freír'),
  ('11111111-1111-1111-1111-111111111106', 'Huevos', 'macro', ARRAY['proteina', 'grasa'], 'Disponible en casi todo el país'),
  ('11111111-1111-1111-1111-111111111106', 'Legumbres (fríjol, lenteja, garbanzo)', 'macro', ARRAY['proteina', 'fibra', 'hierro'], NULL),
  ('11111111-1111-1111-1111-111111111106', 'Frutas tropicales de temporada', 'micro', ARRAY['vitamina_c', 'fibra'], 'Priorizar mercado local'),
  ('11111111-1111-1111-1111-111111111106', 'Verduras de hoja', 'micro', ARRAY['folato', 'hierro', 'magnesio'], NULL);
