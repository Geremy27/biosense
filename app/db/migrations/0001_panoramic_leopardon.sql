CREATE TYPE "public"."lab_report_status" AS ENUM('extracting', 'pending_review', 'confirmed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('persona_natural', 'persona_juridica');--> statement-breakpoint
CREATE TABLE "lab_analytes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_report_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"unit" text,
	"reference_range" text,
	"optimal_range" text,
	"flag" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lab_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"uploaded_by_provider_id" uuid NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"status" "lab_report_status" DEFAULT 'extracting' NOT NULL,
	"lab_name" text,
	"panel_name" text,
	"collected_at" date,
	"extraction_model" text,
	"extraction_error" text,
	"extracted_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"confirmed_by_user_id" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "type" "organization_type" DEFAULT 'persona_juridica' NOT NULL;--> statement-breakpoint
ALTER TABLE "lab_analytes" ADD CONSTRAINT "lab_analytes_lab_report_id_lab_reports_id_fk" FOREIGN KEY ("lab_report_id") REFERENCES "public"."lab_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_analytes" ADD CONSTRAINT "lab_analytes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_uploaded_by_provider_id_providers_id_fk" FOREIGN KEY ("uploaded_by_provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_confirmed_by_user_id_users_id_fk" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_analytes_report_idx" ON "lab_analytes" USING btree ("lab_report_id");--> statement-breakpoint
CREATE INDEX "lab_analytes_patient_idx" ON "lab_analytes" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "lab_reports_patient_idx" ON "lab_reports" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "lab_reports_organization_idx" ON "lab_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "lab_reports_patient_status_idx" ON "lab_reports" USING btree ("patient_id","status");