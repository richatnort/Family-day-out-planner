import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { generateIcal } from "@/lib/calendar";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = querySchema.safeParse({
    date: request.nextUrl.searchParams.get("date") ?? undefined,
    time: request.nextUrl.searchParams.get("time") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { date, time } = parsed.data;

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [activity] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.isActive, true)))
    .limit(1);

  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ical = generateIcal({
    name: activity.name,
    date,
    time,
    websiteUrl: activity.websiteUrl ?? undefined,
    locationName: activity.locationName ?? undefined,
  });

  const slug = activity.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
