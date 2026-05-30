// Simple in-memory rate limiter for API endpoints
// In production, consider using Redis or a dedicated rate limiting service

const rateLimitStore = new Map()

/**
 * Rate limiting middleware
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {Object} options - Rate limiting options
 * @returns {{allowed: boolean, resetTime?: number}}
 */
export function checkRateLimit(identifier, options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100 // requests per window
  } = options

  const now = Date.now()
  const key = `${identifier}:${Math.floor(now / windowMs)}`

  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs }

  if (now > current.resetTime) {
    // Reset window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }

  if (current.count >= maxRequests) {
    return { allowed: false, resetTime: current.resetTime }
  }

  current.count++
  rateLimitStore.set(key, current)
  return { allowed: true }
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up every 30 minutes
setInterval(cleanupRateLimitStore, 30 * 60 * 1000)