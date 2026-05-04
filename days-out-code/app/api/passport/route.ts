import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { passportStamps, activities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const postSchema = z.object({
  activityId: z.number().int().positive(),
  visitedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(200).optional(),
});

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stamps = await db
    .select({
      id: passportStamps.id,
      activityId: passportStamps.activityId,
      activityName: activities.name,
      imageUrl: activities.imageUrl,
      visitedDate: passportStamps.visitedDate,
      notes: passportStamps.notes,
    })
    .from(passportStamps)
    .innerJoin(activities, eq(passportStamps.activityId, activities.id))
    .orderBy(desc(passportStamps.createdAt));

  return NextResponse.json(stamps);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { activityId, visitedDate, notes } = parsed.data;

  const [stamp] = await db
    .insert(passportStamps)
    .values({ activityId, visitedDate, notes })
    .returning();

  return NextResponse.json(stamp);
}
