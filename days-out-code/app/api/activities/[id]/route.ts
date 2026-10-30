import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { fetchOgImage } from "@/lib/og-image";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [activity] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.isActive, true)))
    .limit(1);

  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(activity);
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(["museum", "nature", "adventure", "farm", "water", "heritage", "sport", "rainy-day"]).optional(),
  costTier: z.enum(["free", "cheap", "moderate", "premium"]).optional(),
  weather: z.enum(["sunny", "rainy-friendly", "both"]).optional(),
  setting: z.enum(["indoor", "outdoor", "both"]).optional(),
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
  isConsidering: z.boolean().optional(),
  isPlan: z.boolean().optional(),
  isMystery: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Re-fetch OG image if website_url changed and no explicit imageUrl provided
  let imageUrl = data.imageUrl;
  if (data.websiteUrl !== undefined && data.imageUrl === undefined && data.websiteUrl) {
    imageUrl = await fetchOgImage(data.websiteUrl) ?? undefined;
  }

  const updateData: Record<string, unknown> = { ...data };
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

  const [updated] = await db
    .update(activities)
    .set(updateData)
    .where(eq(activities.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [updated] = await db
    .update(activities)
    .set({ isActive: false })
    .where(eq(activities.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
