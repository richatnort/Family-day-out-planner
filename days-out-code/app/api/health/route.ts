import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET() {
  let dbStatus: "ok" | "error" = "ok";

  try {
    await db.execute(sql`SELECT 1`);
  } catch (err) {
    logger.error({ err }, "Health check db ping failed");
    dbStatus = "error";
  }

  const httpStatus = dbStatus === "ok" ? 200 : 503;
  return NextResponse.json({ status: "ok", db: dbStatus }, { status: httpStatus });
}
