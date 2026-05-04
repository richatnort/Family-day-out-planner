type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000
): { allowed: boolean } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false };
  }

  entry.count++;
  return { allowed: true };
}
