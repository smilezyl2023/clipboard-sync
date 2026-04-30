const hits = new Map<string, number[]>()

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

/** 基于 IP+路径 的滑动窗口限流。返回 { allowed, remaining } */
export function checkRateLimit(
  request: Request,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const ip = getClientIp(request)
  const path = new URL(request.url).pathname
  const key = `${ip}:${path}`
  const now = Date.now()

  let timestamps = hits.get(key)
  if (!timestamps) {
    hits.set(key, [now])
    return { allowed: true, remaining: limit - 1 }
  }

  timestamps = timestamps.filter((t) => now - t < windowMs)

  if (timestamps.length >= limit) {
    hits.set(key, timestamps)
    return { allowed: false, remaining: 0 }
  }

  timestamps.push(now)
  hits.set(key, timestamps)
  return { allowed: true, remaining: limit - timestamps.length }
}
