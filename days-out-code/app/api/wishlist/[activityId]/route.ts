import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { activityId: activityIdParam } = await params;
  const activityId = parseInt(activityIdParam, 10);
  if (isNaN(activityId)) {
    return NextResponse.json({ error: "Invalid activityId" }, { status: 400 });
  }

  await db
    .delete(wishlistItems)
    .where(eq(wishlistItems.activityId, activityId));

  return NextResponse.json({ success: true });
}
