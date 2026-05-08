import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/db";
import { memberships, familyMemberships, activityMemberships } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin: return full membership list with activityIds array
  if (session.user?.role === "admin") {
    const rows = await db.select().from(memberships).orderBy(asc(memberships.name));
    const allLinks = await db.select().from(activityMemberships);
    const result = rows.map((m) => ({
      ...m,
      activityIds: allLinks.filter((l) => l.membershipId === m.id).map((l) => l.activityId),
    }));
    return NextResponse.json(result);
  }

  // PIN (children's views): flat tuples used for "FREE with [name]" badges
  const results = await db
    .select({
      membershipId: familyMemberships.membershipId,
      name: memberships.name,
      activityId: activityMemberships.activityId,
    })
    .from(familyMemberships)
    .innerJoin(memberships, eq(familyMemberships.membershipId, memberships.id))
    .innerJoin(activityMemberships, eq(memberships.id, activityMemberships.membershipId));

  return NextResponse.json(results);
}

const membershipSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  activityIds: z.array(z.number().int()).optional(),
});

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = membershipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { activityIds, ...fields } = parsed.data;

  const [created] = await db
    .insert(memberships)
    .values({
      name: fields.name,
      description: fields.description ?? null,
      expiresAt: fields.expiresAt ?? null,
    })
    .returning();

  if (activityIds && activityIds.length > 0) {
    await db.insert(activityMemberships).values(
      activityIds.map((activityId) => ({ activityId, membershipId: created.id }))
    );
  }

  return NextResponse.json({ ...created, activityIds: activityIds ?? [] }, { status: 201 });
}
