import ogs from "open-graph-scraper";
import { logger } from "./logger";

export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const { result } = await ogs({ url, timeout: 5000 });
    if (result.success && result.ogImage?.[0]?.url) {
      return result.ogImage[0].url;
    }
    return null;
  } catch (err) {
    logger.warn({ err, url }, "OG image fetch failed");
    return null;
  }
}
