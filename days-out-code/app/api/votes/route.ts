import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { votes } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const postSchema = z.object({
  activityId: z.number().int().positive(),
  emoji: z.string().min(1).max(10),
  voterName: z.string().min(1).max(30),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activityIdParam = request.nextUrl.searchParams.get("activityId");

  if (activityIdParam !== null) {
    const activityId = parseInt(activityIdParam, 10);
    if (isNaN(activityId)) {
      return NextResponse.json({ error: "Invalid activityId" }, { status: 400 });
    }
    const results = await db
      .select()
      .from(votes)
      .where(eq(votes.activityId, activityId));
    return NextResponse.json(results);
  }

  const results = await db.select().from(votes);
  return NextResponse.json(results);
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

  const { activityId, emoji, voterName } = parsed.data;

  const [upserted] = await db
    .insert(votes)
    .values({ activityId, emoji, voterName })
    .onConflictDoUpdate({
      target: [votes.activityId, votes.voterName],
      set: { emoji: sql`excluded.emoji` },
    })
    .returning();

  return NextResponse.json(upserted);
}
