ALTER TABLE "applications" ADD COLUMN "city" varchar(120);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "remote_only" boolean DEFAULT false NOT NULL;