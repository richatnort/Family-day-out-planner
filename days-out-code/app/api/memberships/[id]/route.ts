import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/db";
import { memberships, activityMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [membership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.id, id))
    .limit(1);

  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const links = await db
    .select()
    .from(activityMemberships)
    .where(eq(activityMemberships.membershipId, id));

  return NextResponse.json({ ...membership, activityIds: links.map((l) => l.activityId) });
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  activityIds: z.array(z.number().int()).optional(),
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

  const { activityIds, ...fields } = parsed.data;

  const [updated] = await db
    .update(memberships)
    .set(fields)
    .where(eq(memberships.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (activityIds !== undefined) {
    await db.delete(activityMemberships).where(eq(activityMemberships.membershipId, id));
    if (activityIds.length > 0) {
      await db.insert(activityMemberships).values(
        activityIds.map((activityId) => ({ activityId, membershipId: id }))
      );
    }
  }

  const links = await db
    .select()
    .from(activityMemberships)
    .where(eq(activityMemberships.membershipId, id));

  return NextResponse.json({ ...updated, activityIds: links.map((l) => l.activityId) });
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

  await db.delete(memberships).where(eq(memberships.id, id));

  return NextResponse.json({ success: true });
}
