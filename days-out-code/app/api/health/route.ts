import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "ok", db: "ok" });
  } catch {
    return NextResponse.json({ status: "ok", db: "error" }, { status: 503 });
  }
}
