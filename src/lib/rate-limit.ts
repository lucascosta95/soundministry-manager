
const trackers = new Map<string, { count: number; expiresAt: number }>()

/**
 * Basic in-memory rate limiter
 * @param key Unique key (e.g. IP address)
 * @param limit Max requests allowed
 * @param windowMs Time window in milliseconds
 * @returns true if allowed, false if limit exceeded
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = trackers.get(key)

  // Clean up expired entries lazily when accessing (optional optimization: clear map if too big)
  if (trackers.size > 10000) {
    // Prevent memory leak by brute force clearing if under attack/heavy load
    // In production, use Redis.
    trackers.clear()
  }

  if (!record || now > record.expiresAt) {
    trackers.set(key, {
      count: 1,
      expiresAt: now + windowMs
    })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}
