const rateLimiter = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, maxAttempts: number, windowMs: number) {
  const now = Date.now();
  const record = rateLimiter.get(key);

  if (!record || record.resetTime < now) {
    rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  rateLimiter.set(key, record);
  return { success: true, remaining: maxAttempts - record.count };
}
