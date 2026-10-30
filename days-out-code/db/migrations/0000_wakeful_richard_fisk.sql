CREATE TYPE "public"."category" AS ENUM('museum', 'nature', 'adventure', 'farm', 'water', 'heritage', 'sport', 'rainy-day');--> statement-breakpoint
CREATE TYPE "public"."cost_tier" AS ENUM('free', 'cheap', 'moderate', 'premium');--> statement-breakpoint
CREATE TYPE "public"."food" AS ENUM('on-site', 'nearby', 'none', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."setting" AS ENUM('indoor', 'outdoor', 'both');--> statement-breakpoint
CREATE TYPE "public"."weather" AS ENUM('sunny', 'rainy-friendly', 'both');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "category" NOT NULL,
	"cost_tier" "cost_tier" NOT NULL,
	"weather" "weather" NOT NULL,
	"setting" "setting" NOT NULL,
	"food" "food" DEFAULT 'unknown',
	"website_url" text,
	"image_url" text,
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"location_name" text,
	"age_min" integer,
	"age_max" integer,
	"prebooking_required" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_considering" boolean DEFAULT false NOT NULL,
	"is_plan" boolean DEFAULT false NOT NULL,
	"is_mystery" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_memberships" (
	"activity_id" integer NOT NULL,
	"membership_id" integer NOT NULL,
	CONSTRAINT "activity_memberships_activity_id_membership_id_pk" PRIMARY KEY("activity_id","membership_id")
);
--> statement-breakpoint
CREATE TABLE "family_memberships" (
	"membership_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"expires_at" date
);
--> statement-breakpoint
CREATE TABLE "passport_stamps" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"visited_date" date NOT NULL,
	"notes" text,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"emoji" text NOT NULL,
	"voter_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "votes_activity_voter_unique" UNIQUE("activity_id","voter_name")
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"activity_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_memberships" ADD CONSTRAINT "activity_memberships_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_memberships" ADD CONSTRAINT "activity_memberships_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passport_stamps" ADD CONSTRAINT "passport_stamps_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;