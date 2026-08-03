CREATE TYPE "public"."medical_history_status" AS ENUM('draft', 'confirmed');--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "personal_history_1" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "personal_history_2" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "medications" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "supplements" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "infectious_history" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "traumatic_history" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "toxicological_history" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "vaccines" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "habits" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "gyneco_obstetric_history" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "psychosocial_history" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "status" "medical_history_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "confirmed_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD CONSTRAINT "patient_medical_histories_confirmed_by_user_id_users_id_fk" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_medical_histories_patient_status_idx" ON "patient_medical_histories" USING btree ("patient_id","status");--> statement-breakpoint
-- Backfill new structured columns from the legacy free-text columns so existing
-- records keep showing their content in the new form fields. Legacy columns are
-- kept untouched (read-only from now on) for audit continuity.
UPDATE "patient_medical_histories" SET "personal_history_1" = "personal_history" WHERE "personal_history" IS NOT NULL;--> statement-breakpoint
UPDATE "patient_medical_histories" SET "medications" = "medications_and_supplements" WHERE "medications_and_supplements" IS NOT NULL;--> statement-breakpoint
UPDATE "patient_medical_histories" SET "habits" = "habits_lifestyle" WHERE "habits_lifestyle" IS NOT NULL;