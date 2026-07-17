import { NextResponse } from 'next/server'
import { rateLimit, checkRateLimit, rateLimiters } from '@/lib/rate-limit'

/**
 * Middleware function to apply to API routes
 * Adds rate limiting and proper response headers
 * 
 * Usage in route handler:
 * import { withMiddleware } from '@/lib/api-middleware'
 * 
 * export async function GET(request) {
 *     const middleware = withMiddleware(request, { rateLimit: 'api' })
 *     if (middleware.error) return middleware.error
 *     
 *     // Your handler code here
 * }
 */

export function withMiddleware(request, options = {}) {
    const {
        rateLimit: rateLimitType = 'api',
        requireAuth = false,
        auth = null
    } = options

    const errors = []

    // Apply rate limiting if specified
    if (rateLimitType && rateLimiters[rateLimitType]) {
        const limiter = rateLimiters[rateLimitType]
        const status = limiter(request)
        
        if (!status.allowed) {
            return {
                error: checkRateLimit(status),
                rateLimitStatus: status
            }
        }
    }

    return {
        error: null,
        rateLimitStatus: null
    }
}

/**
 * Add security and performance headers to all responses
 */
export function withSecurityHeaders(response) {
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Performance headers
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    
    return response
}

/**
 * Wrapper to apply both middleware and security headers
 */
export async function apiHandler(request, handler, options = {}) {
    try {
        // Check middleware (rate limiting, auth, etc)
        const middleware = withMiddleware(request, options)
        if (middleware.error) {
            return middleware.error
        }

        // Call the actual handler
        let response = await handler(request)
        
        // Add security and performance headers
        response = withSecurityHeaders(response)
        
        return response
    } catch (error) {
        console.error('API error:', error)
        
        const response = NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        )
        
        return withSecurityHeaders(response)
    }
}

/**
 * Create a simple API response with proper headers
 */
export function apiResponse(data, status = 200, headers = {}) {
    const response = NextResponse.json(data, { status })
    
    // Add standard headers
    response.headers.set('Content-Type', 'application/json')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    // Add any custom headers
    Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
    })
    
    return response
}

/**
 * Create an error response
 */
export function apiError(message, status = 500, error = null) {
    const response = NextResponse.json(
        {
            error: message,
            ...(process.env.NODE_ENV === 'development' && error && { details: error.message })
        },
        { status }
    )
    
    return withSecurityHeaders(response)
}
