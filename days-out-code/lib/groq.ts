import Groq from "groq-sdk";
import { logger } from "./logger";

const EXTRACTION_PROMPT = `You are extracting information about a visitor attraction in Yorkshire, UK.
Given the following website content, extract the activity details.

Return ONLY valid JSON matching this schema — no markdown, no explanation:
{
  "name": string,
  "description": string (max 200 chars, written for children aged 4-12, enthusiastic tone),
  "category": one of: "museum" | "nature" | "adventure" | "farm" | "water" | "heritage" | "sport" | "rainy-day",
  "cost_tier": one of: "free" | "cheap" | "moderate" | "premium",
  "weather": one of: "sunny" | "rainy-friendly" | "both",
  "setting": one of: "indoor" | "outdoor" | "both",
  "food": one of: "on-site" | "nearby" | "none" | "unknown",
  "prebooking_required": boolean,
  "website_url": string
}

Cost tier thresholds (per child entry price):
- free: £0
- cheap: £0.01–£7.99
- moderate: £8.00–£14.99
- premium: £15.00+

If you cannot determine a value, use null for optional fields or your best guess for required fields.
If the content is not about a visitor attraction, return { "error": "not an attraction" }.

Website content:
`;

export interface ExtractionResult {
  name?: string;
  description?: string;
  category?: string;
  cost_tier?: string;
  weather?: string;
  setting?: string;
  food?: string;
  prebooking_required?: boolean;
  website_url?: string;
  error?: string;
}

export async function extractActivityFromContent(content: string): Promise<ExtractionResult> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: EXTRACTION_PROMPT + content }],
    temperature: 0,
    max_tokens: 512,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  logger.info({ contentLength: content.length }, "Groq extraction complete");
  return JSON.parse(text) as ExtractionResult;
}
