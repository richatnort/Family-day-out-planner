import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  pgEnum,
  date,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";

export const weatherEnum = pgEnum("weather", ["sunny", "rainy-friendly", "both"]);
export const settingEnum = pgEnum("setting", ["indoor", "outdoor", "both"]);
export const costTierEnum = pgEnum("cost_tier", ["free", "cheap", "moderate", "premium"]);
export const categoryEnum = pgEnum("category", [
  "museum",
  "nature",
  "adventure",
  "farm",
  "water",
  "heritage",
  "sport",
  "rainy-day",
]);
export const foodEnum = pgEnum("food", ["on-site", "nearby", "none", "unknown"]);

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: categoryEnum("category").notNull(),
  costTier: costTierEnum("cost_tier").notNull(),
  weather: weatherEnum("weather").notNull(),
  setting: settingEnum("setting").notNull(),
  food: foodEnum("food").default("unknown"),
  websiteUrl: text("website_url"),
  imageUrl: text("image_url"),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  locationName: text("location_name"),
  ageMin: integer("age_min"),
  ageMax: integer("age_max"),
  prebookingRequired: boolean("prebooking_required").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  isConsidering: boolean("is_considering").default(false).notNull(),
  isPlan: boolean("is_plan").default(false).notNull(),
  isMystery: boolean("is_mystery").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  expiresAt: date("expires_at"),
});

export const familyMemberships = pgTable("family_memberships", {
  membershipId: integer("membership_id")
    .primaryKey()
    .references(() => memberships.id, { onDelete: "cascade" }),
});

export const activityMemberships = pgTable(
  "activity_memberships",
  {
    activityId: integer("activity_id")
      .references(() => activities.id, { onDelete: "cascade" })
      .notNull(),
    membershipId: integer("membership_id")
      .references(() => memberships.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.activityId, t.membershipId] })]
);

export const votes = pgTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .references(() => activities.id, { onDelete: "cascade" })
      .notNull(),
    emoji: text("emoji").notNull(),
    voterName: text("voter_name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("votes_activity_voter_unique").on(t.activityId, t.voterName)]
);

export const passportStamps = pgTable("passport_stamps", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id")
    .references(() => activities.id, { onDelete: "cascade" })
    .notNull(),
  visitedDate: date("visited_date").notNull(),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wishlistItems = pgTable("wishlist_items", {
  activityId: integer("activity_id")
    .primaryKey()
    .references(() => activities.id, { onDelete: "cascade" }),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
