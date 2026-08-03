ALTER TYPE "public"."medical_history_status" ADD VALUE 'extracting' BEFORE 'draft';--> statement-breakpoint
ALTER TYPE "public"."medical_history_status" ADD VALUE 'failed';--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "original_filename" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "extraction_model" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "extraction_error" text;--> statement-breakpoint
ALTER TABLE "patient_medical_histories" ADD COLUMN "extracted_at" timestamp with time zone;