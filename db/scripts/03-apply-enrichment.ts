import * as fs from "fs";
import * as path from "path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activities } from "@/db/schema";

interface EnrichBlock {
  name: string;
  status: "include" | "skip";
  websiteUrl?: string;
  description?: string;
  category?: string;
  costTier?: string;
  weather?: string;
  setting?: string;
  food?: string;
  prebookingRequired?: boolean;
}

function parseBlock(chunk: string): EnrichBlock | null {
  const lines = chunk.trim().split("\n");
  const nameLine = lines.find((l) => l.startsWith("## "));
  if (!nameLine) return null;

  const name = nameLine.replace(/^## /, "").trim();
  const fields: Record<string, string> = {};

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)/);
    if (match) {
      fields[match[1]] = match[2].trim();
    }
  }

  return {
    name,
    status: fields.status === "skip" ? "skip" : "include",
    websiteUrl: fields.websiteUrl || undefined,
    description: fields.description || undefined,
    category: fields.category || undefined,
    costTier: fields.costTier || undefined,
    weather: fields.weather || undefined,
    setting: fields.setting || undefined,
    food: fields.food || undefined,
    prebookingRequired: fields.prebooking !== undefined
      ? fields.prebooking === "true"
      : undefined,
  };
}

async function main() {
  const mdPath =
    process.argv[2] ??
    path.join(process.cwd(), "../business/retroactive-enrich/02-data-review.md");

  if (!fs.existsSync(mdPath)) {
    console.error(`File not found: ${mdPath}`);
    console.error("Run from days-out-code/ or pass the file path as an argument.");
    process.exit(1);
  }

  const content = fs.readFileSync(mdPath, "utf-8");
  const chunks = content.split(/\n---\n/);

  const blocks: EnrichBlock[] = [];
  for (const chunk of chunks) {
    const block = parseBlock(chunk);
    if (block) blocks.push(block);
  }

  console.log(`Parsed ${blocks.length} activities from review file\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const block of blocks) {
    if (block.status === "skip") {
      console.log(`  SKIP      ${block.name}`);
      skipped++;
      continue;
    }

    const updateData: Record<string, unknown> = {};
    if (block.websiteUrl !== undefined) updateData.websiteUrl = block.websiteUrl;
    if (block.description !== undefined) updateData.description = block.description;
    if (block.category !== undefined) updateData.category = block.category;
    if (block.costTier !== undefined) updateData.costTier = block.costTier;
    if (block.weather !== undefined) updateData.weather = block.weather;
    if (block.setting !== undefined) updateData.setting = block.setting;
    if (block.food !== undefined) updateData.food = block.food;
    if (block.prebookingRequired !== undefined)
      updateData.prebookingRequired = block.prebookingRequired;

    const result = await db
      .update(activities)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(updateData as any)
      .where(eq(activities.name, block.name))
      .returning({ id: activities.id });

    if (result.length === 0) {
      console.log(`  NOT FOUND ${block.name}`);
      notFound++;
    } else {
      console.log(`  OK        ${block.name}`);
      updated++;
    }
  }

  console.log(`\n── Summary ─────────────────────────────`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Not found: ${notFound}`);
  console.log(`────────────────────────────────────────`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
