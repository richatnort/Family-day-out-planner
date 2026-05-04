import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { z } from "zod";

const postSchema = z.object({
  activityId: z.number().int().positive(),
});

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db
    .select({ activityId: wishlistItems.activityId })
    .from(wishlistItems);

  return NextResponse.json(items.map((i) => i.activityId));
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

  const { activityId } = parsed.data;

  await db
    .insert(wishlistItems)
    .values({ activityId })
    .onConflictDoNothing();

  return NextResponse.json({ activityId });
}
