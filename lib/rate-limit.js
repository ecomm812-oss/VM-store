/**
 * Rate limiter for protecting API endpoints
 * Tracks requests per IP address and enforces limits
 */

const requestCounts = new Map()
const WINDOW_MS = 60 * 1000 // 1 minute window
const CLEANUP_INTERVAL = 5 * 60 * 1000 // Cleanup every 5 minutes

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now()
    for (const [ip, data] of requestCounts.entries()) {
        if (now - data.resetTime > WINDOW_MS * 2) {
            requestCounts.delete(ip)
        }
    }
}, CLEANUP_INTERVAL)

/**
 * Create a rate limiter for a specific endpoint
 * @param {number} maxRequests - Maximum requests allowed per window
 * @param {number} windowMs - Time window in milliseconds (default: 1 minute)
 * @returns {Function} Middleware function to check rate limit
 */
export function rateLimit(maxRequests = 30, windowMs = WINDOW_MS) {
    return function middleware(request) {
        // Get client IP from request headers or connection
        const ip = request.ip || 
                  request.headers.get('x-forwarded-for')?.split(',')[0] ||
                  request.headers.get('x-real-ip') ||
                  'unknown'

        const now = Date.now()
        const userData = requestCounts.get(ip) || { count: 0, resetTime: now }

        // Reset counter if window has passed
        if (now - userData.resetTime > windowMs) {
            userData.count = 0
            userData.resetTime = now
        }

        userData.count++
        requestCounts.set(ip, userData)

        // Return rate limit status
        return {
            allowed: userData.count <= maxRequests,
            remaining: Math.max(0, maxRequests - userData.count),
            resetTime: userData.resetTime + windowMs,
            retryAfter: userData.count > maxRequests ? 
                Math.ceil((userData.resetTime + windowMs - now) / 1000) : null
        }
    }
}

/**
 * Rate limit response helper
 * @param {Object} rateLimitStatus - Status from rateLimit middleware
 * @returns {Response|null} Rate limit error response or null if allowed
 */
export function checkRateLimit(rateLimitStatus) {
    if (!rateLimitStatus.allowed) {
        return new Response(
            JSON.stringify({
                error: 'Too Many Requests',
                retryAfter: rateLimitStatus.retryAfter,
                message: `Rate limit exceeded. Try again in ${rateLimitStatus.retryAfter} seconds.`
            }),
            {
                status: 429,
                headers: {
                    'Retry-After': String(rateLimitStatus.retryAfter),
                    'X-RateLimit-Remaining': String(rateLimitStatus.remaining),
                    'X-RateLimit-Reset': new Date(rateLimitStatus.resetTime).toISOString()
                }
            }
        )
    }
    return null
}

/**
 * Pre-configured rate limiters for different endpoint types
 */
export const rateLimiters = {
    // Public endpoints - more permissive
    public: rateLimit(100, 60 * 1000), // 100 requests per minute
    
    // API endpoints - moderate
    api: rateLimit(50, 60 * 1000), // 50 requests per minute
    
    // Auth endpoints - strict (prevent brute force)
    auth: rateLimit(5, 60 * 1000), // 5 requests per minute
    
    // Admin endpoints - moderate
    admin: rateLimit(30, 60 * 1000), // 30 requests per minute
    
    // Upload endpoints - strict (bandwidth intensive)
    upload: rateLimit(10, 60 * 1000), // 10 uploads per minute
}
