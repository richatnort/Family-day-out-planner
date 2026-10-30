import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { fetchOgImage } from "@/lib/og-image";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { and, or, inArray, eq, asc } from "drizzle-orm";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const weatherParams = sp.getAll("weather");
  const settingParams = sp.getAll("setting");
  const costTierParams = sp.getAll("costTier");
  const consideringOnly = sp.get("considering") === "true";
  const allIncludingInactive = sp.get("all") === "true" && session.user?.role === "admin";

  const buildWeatherFilter = (params: string[]) => {
    if (params.length === 0) return undefined;
    const values = new Set<string>();
    for (const p of params) {
      if (p === "sunny") { values.add("sunny"); values.add("both"); }
      else if (p === "rainy") { values.add("rainy-friendly"); values.add("both"); }
    }
    if (values.size === 0) return undefined;
    return inArray(activities.weather, [...values] as ("sunny" | "rainy-friendly" | "both")[]);
  };

  const buildSettingFilter = (params: string[]) => {
    if (params.length === 0) return undefined;
    const values = new Set<string>();
    for (const p of params) {
      if (p === "indoor") { values.add("indoor"); values.add("both"); }
      else if (p === "outdoor") { values.add("outdoor"); values.add("both"); }
    }
    if (values.size === 0) return undefined;
    return inArray(activities.setting, [...values] as ("indoor" | "outdoor" | "both")[]);
  };

  const buildCostTierFilter = (params: string[]) => {
    if (params.length === 0) return undefined;
    const valid = ["free", "cheap", "moderate", "premium"] as const;
    const values = params.filter((p): p is typeof valid[number] => valid.includes(p as typeof valid[number]));
    if (values.length === 0) return undefined;
    return inArray(activities.costTier, values);
  };

  const conditions = [
    allIncludingInactive ? undefined : eq(activities.isActive, true),
    buildWeatherFilter(weatherParams),
    buildSettingFilter(settingParams),
    buildCostTierFilter(costTierParams),
    consideringOnly ? eq(activities.isConsidering, true) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const results = await db
    .select()
    .from(activities)
    .where(and(...conditions))
    .orderBy(asc(activities.name));

  return NextResponse.json(results);
}

const activityBodySchema = z.object({
  name: z.string().min(1),
  category: z.enum(["museum", "nature", "adventure", "farm", "water", "heritage", "sport", "rainy-day"]),
  costTier: z.enum(["free", "cheap", "moderate", "premium"]),
  weather: z.enum(["sunny", "rainy-friendly", "both"]),
  setting: z.enum(["indoor", "outdoor", "both"]),
  websiteUrl: z.string().url().nullable().optional(),
  lat: z.string().nullable().optional(),
  lng: z.string().nullable().optional(),
  locationName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  food: z.enum(["on-site", "nearby", "none", "unknown"]).optional(),
  ageMin: z.number().int().nullable().optional(),
  ageMax: z.number().int().nullable().optional(),
  prebookingRequired: z.boolean().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = activityBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  let imageUrl = data.imageUrl ?? null;
  if (!imageUrl && data.websiteUrl) {
    imageUrl = await fetchOgImage(data.websiteUrl);
  }

  const [created] = await db
    .insert(activities)
    .values({
      name: data.name,
      category: data.category,
      costTier: data.costTier,
      weather: data.weather,
      setting: data.setting,
      websiteUrl: data.websiteUrl ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      locationName: data.locationName ?? null,
      description: data.description ?? null,
      food: data.food ?? "unknown",
      ageMin: data.ageMin ?? null,
      ageMax: data.ageMax ?? null,
      prebookingRequired: data.prebookingRequired ?? false,
      imageUrl,
      isActive: true,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
