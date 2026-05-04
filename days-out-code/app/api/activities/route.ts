import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { and, or, inArray, eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weatherParams = request.nextUrl.searchParams.getAll("weather");
  const settingParams = request.nextUrl.searchParams.getAll("setting");

  // Build weather filter
  // weather=sunny  → IN ('sunny','both')
  // weather=rainy  → IN ('rainy-friendly','both')
  // weather=sunny&weather=rainy → IN ('sunny','rainy-friendly','both') (no effective filter)
  const buildWeatherFilter = (params: string[]) => {
    if (params.length === 0) return undefined;

    const values = new Set<string>();
    for (const p of params) {
      if (p === "sunny") {
        values.add("sunny");
        values.add("both");
      } else if (p === "rainy") {
        values.add("rainy-friendly");
        values.add("both");
      }
    }
    if (values.size === 0) return undefined;
    return inArray(activities.weather, [...values] as [string, ...string[]]);
  };

  // Build setting filter
  // setting=indoor  → IN ('indoor','both')
  // setting=outdoor → IN ('outdoor','both')
  const buildSettingFilter = (params: string[]) => {
    if (params.length === 0) return undefined;

    const values = new Set<string>();
    for (const p of params) {
      if (p === "indoor") {
        values.add("indoor");
        values.add("both");
      } else if (p === "outdoor") {
        values.add("outdoor");
        values.add("both");
      }
    }
    if (values.size === 0) return undefined;
    return inArray(activities.setting, [...values] as [string, ...string[]]);
  };

  const weatherFilter = buildWeatherFilter(weatherParams);
  const settingFilter = buildSettingFilter(settingParams);

  const conditions = [
    eq(activities.isActive, true),
    weatherFilter,
    settingFilter,
  ].filter(Boolean) as Parameters<typeof and>;

  const results = await db
    .select()
    .from(activities)
    .where(and(...conditions))
    .orderBy(asc(activities.name));

  return NextResponse.json(results);
}
