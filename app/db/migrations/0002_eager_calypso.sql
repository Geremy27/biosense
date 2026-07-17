CREATE TYPE "public"."clinical_recommendation_status" AS ENUM('generating', 'pending_review', 'confirmed', 'failed');--> statement-breakpoint
CREATE TABLE "clinical_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"lab_report_id" uuid NOT NULL,
	"prompt_id" uuid,
	"prompt_snapshot" text NOT NULL,
	"model" text NOT NULL,
	"status" "clinical_recommendation_status" DEFAULT 'generating' NOT NULL,
	"input_patient_snapshot" jsonb NOT NULL,
	"input_lab_snapshot" jsonb NOT NULL,
	"input_medications_snapshot" text,
	"output" jsonb,
	"generation_error" text,
	"generated_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"confirmed_by_user_id" uuid,
	"created_by_user_id" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recommendation_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"system_prompt" text NOT NULL,
	"user_prompt_template" text NOT NULL,
	"output_schema_version" integer DEFAULT 1 NOT NULL,
	"model" text DEFAULT 'gpt-4o' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by_user_id" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "recommendation_prompts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "clinical_recommendations" ADD CONSTRAINT "clinical_recommendations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_recommendations" ADD CONSTRAINT "clinical_recommendations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_recommendations" ADD CONSTRAINT "clinical_recommendations_lab_report_id_lab_reports_id_fk" FOREIGN KEY ("lab_report_id") REFERENCES "public"."lab_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_recommendations" ADD CONSTRAINT "clinical_recommendations_prompt_id_recommendation_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."recommendation_prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_recommendations" ADD CONSTRAINT "clinical_recommendations_confirmed_by_user_id_users_id_fk" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_recommendations" ADD CONSTRAINT "clinical_recommendations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_prompts" ADD CONSTRAINT "recommendation_prompts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clinical_recommendations_patient_idx" ON "clinical_recommendations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "clinical_recommendations_lab_report_idx" ON "clinical_recommendations" USING btree ("lab_report_id");--> statement-breakpoint
CREATE INDEX "clinical_recommendations_patient_status_idx" ON "clinical_recommendations" USING btree ("patient_id","status");