/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Suitable for a single-instance deployment. For multi-instance production
 * deployments, replace with a shared store (e.g. Upstash Redis) keeping the
 * same interface.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

// Periodically clean up stale buckets to avoid unbounded memory growth.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  buckets.forEach((bucket, key) => {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  });
}

/**
 * Returns true if the request identified by `key` is allowed, false if the
 * rate limit is exceeded.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  cleanup(windowMs);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return true;
}

/** Extract a best-effort client identifier from a Request. */
export function clientKey(req: Request, scope: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${scope}:${ip}`;
}
