import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { validateUrl } from "@/lib/ssrf-guard";
import { extractActivityFromContent } from "@/lib/groq";
import { logger } from "@/lib/logger";
import { z } from "zod";

const bodySchema = z.object({ url: z.string().url() });

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const { url } = parsed.data;

  const { valid, error: urlError } = validateUrl(url);
  if (!valid) {
    return NextResponse.json({ error: urlError ?? "That URL isn't allowed" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FamilyDayOut/1.0)" },
    });
    html = await res.text();
  } catch (err) {
    logger.warn({ err, url }, "Page fetch failed during import");
    return NextResponse.json(
      { error: "Auto-fill unavailable — please fill in manually" },
      { status: 502 }
    );
  }

  const content = htmlToText(html);

  let extracted;
  try {
    extracted = await extractActivityFromContent(content);
  } catch (err) {
    logger.warn({ err, url }, "Groq extraction failed");
    return NextResponse.json(
      { error: "Auto-fill unavailable — please fill in manually" },
      { status: 502 }
    );
  }

  if (extracted.error === "not an attraction") {
    return NextResponse.json(
      { error: "That page doesn't look like a venue — try a different URL or fill in manually" },
      { status: 422 }
    );
  }

  return NextResponse.json({
    name: extracted.name ?? "",
    description: extracted.description ?? "",
    category: extracted.category ?? "nature",
    costTier: extracted.cost_tier ?? "free",
    weather: extracted.weather ?? "both",
    setting: extracted.setting ?? "outdoor",
    food: extracted.food ?? "unknown",
    prebookingRequired: extracted.prebooking_required ?? false,
    websiteUrl: url,
  });
}
