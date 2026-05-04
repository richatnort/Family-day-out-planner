import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { memberships, familyMemberships, activityMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
