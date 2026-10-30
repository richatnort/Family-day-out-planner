import ogs from "open-graph-scraper";

export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const { result } = await ogs({ url, timeout: 5000 });
    const images = result.ogImage;
    if (!images || images.length === 0) return null;
    return images[0].url ?? null;
  } catch {
    return null;
  }
}
