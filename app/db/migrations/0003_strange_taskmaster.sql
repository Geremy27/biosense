CREATE TABLE "patient_medical_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"recorded_at" date NOT NULL,
	"chief_complaint" text,
	"personal_history" text,
	"family_history" text,
	"surgical_history" text,
	"allergies" text,
	"medications_and_supplements" text,
	"habits_lifestyle" text,
	"notes" text,
	"created_by_user_id" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "clinical_recommendations" ADD COLUMN "input_medical_history_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD CONSTRAINT "patient_medical_histories_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD CONSTRAINT "patient_medical_histories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD CONSTRAINT "patient_medical_histories_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_medical_histories_patient_idx" ON "patient_medical_histories" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_medical_histories_patient_recorded_idx" ON "patient_medical_histories" USING btree ("patient_id","recorded_at");