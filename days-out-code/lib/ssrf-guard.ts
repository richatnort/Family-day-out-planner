const BLOCKED_PREFIXES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

export function validateUrl(rawUrl: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, error: "Invalid URL" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, error: "Only HTTP/HTTPS URLs are allowed" };
  }

  const host = parsed.hostname;

  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return { valid: false, error: "That URL isn't allowed" };
  }

  for (const pattern of BLOCKED_PREFIXES) {
    if (pattern.test(host)) {
      return { valid: false, error: "That URL isn't allowed" };
    }
  }

  return { valid: true };
}
