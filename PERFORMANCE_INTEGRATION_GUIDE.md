# How to Use Rate Limiting & Caching in Your Endpoints

This guide shows how to integrate the new performance and security features into existing API endpoints.

## Quick Start

### 1. Add Rate Limiting to an Endpoint

**Before:**
```javascript
export async function GET(request) {
    const data = await prisma.product.findMany()
    return NextResponse.json(data)
}
```

**After:**
```javascript
import { apiHandler, apiResponse } from '@/lib/api-middleware'

export async function GET(request) {
    return apiHandler(request, async (req) => {
        const data = await prisma.product.findMany({
            select: { id: true, name: true, price: true }
        })
        return apiResponse(data)
    }, { rateLimit: 'api' })
}
```

### 2. Add Caching Headers

```javascript
import { NextResponse } from 'next/server'

export async function GET(request) {
    const data = await prisma.store.findMany()
    const response = NextResponse.json(data)
    
    // Cache for 2 minutes
    response.headers.set('Cache-Control', 'private, max-age=120')
    
    return response
}
```

### 3. Optimize Query Performance

**Before - Fetches all fields:**
```javascript
const products = await prisma.product.findMany({
    include: { store: true }
})
```

**After - Only needed fields:**
```javascript
const products = await prisma.product.findMany({
    select: {
        id: true,
        name: true,
        price: true,
        store: { select: { id: true, name: true } }
    }
})
```

### 4. Parallelize Independent Queries

**Before - Sequential:**
```javascript
const stores = await prisma.store.count()
const products = await prisma.product.count()
const orders = await prisma.order.count()
```

**After - Parallel:**
```javascript
const [stores, products, orders] = await Promise.all([
    prisma.store.count(),
    prisma.product.count(),
    prisma.order.count()
])
```

## Rate Limit Tiers

Use the appropriate rate limit for each endpoint type:

```javascript
// Public endpoints - generous limits
export async function GET(request) {
    return apiHandler(request, handler, { rateLimit: 'public' })
}

// API endpoints - moderate limits
export async function POST(request) {
    return apiHandler(request, handler, { rateLimit: 'api' })
}

// Auth endpoints - strict (brute force protection)
export async function POST(request) {
    return apiHandler(request, handler, { rateLimit: 'auth' })
}

// Admin endpoints - moderate
export async function GET(request) {
    return apiHandler(request, handler, { rateLimit: 'admin' })
}

// Upload endpoints - strict (bandwidth intensive)
export async function POST(request) {
    return apiHandler(request, handler, { rateLimit: 'upload' })
}
```

## Complete Example

Here's a full example of an optimized API endpoint:

```javascript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminUser } from '@/lib/security'
import { apiHandler, apiResponse, apiError } from '@/lib/api-middleware'

// Cache dashboard for 1 minute
const CACHE_HEADERS = {
    'Cache-Control': 'private, max-age=60, s-maxage=300'
}

export async function GET(request) {
    return apiHandler(request, async (req) => {
        // Check admin auth
        const isAdmin = await isAdminUser()
        if (!isAdmin) {
            return apiError('Unauthorized', 403)
        }

        try {
            // Parallelize independent queries
            const [productCount, storeCount, orderCount, revenueData] = await Promise.all([
                prisma.product.count(),
                prisma.store.count(),
                prisma.order.count(),
                prisma.order.aggregate({
                    _sum: { total: true },
                    where: { status: 'DELIVERED' }
                })
            ])

            // Get recent data with optimized queries
            const [recentProducts, recentOrders] = await Promise.all([
                prisma.product.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        storeId: true
                    }
                }),
                prisma.order.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        total: true,
                        status: true,
                        createdAt: true
                    }
                })
            ])

            const response = apiResponse({
                products: productCount,
                stores: storeCount,
                orders: orderCount,
                revenue: revenueData._sum.total || 0,
                recentProducts,
                recentOrders
            })

            // Add caching headers
            Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
                response.headers.set(key, value)
            })

            return response
        } catch (error) {
            console.error('Dashboard error:', error)
            return apiError('Failed to load dashboard', 500, error)
        }
    }, { rateLimit: 'admin' })
}
```

## Monitoring Rate Limits

The rate limiter returns these headers:
- `X-RateLimit-Remaining`: How many requests left in window
- `X-RateLimit-Reset`: When the limit resets (ISO timestamp)
- `Retry-After`: Seconds to wait before retrying (when limited)

Check these in your frontend to show user-friendly messages:

```javascript
const response = await fetch('/api/endpoint')
const remaining = response.headers.get('X-RateLimit-Remaining')
const retryAfter = response.headers.get('Retry-After')

if (response.status === 429) {
    console.log(`Rate limited. Try again in ${retryAfter}s`)
}
```

## Testing

Test rate limiting locally:

```javascript
// lib/__tests__/rate-limit.test.js
import { rateLimit } from '@/lib/rate-limit'

describe('Rate Limiter', () => {
    it('blocks requests after limit', () => {
        const limiter = rateLimit(3, 1000)
        const mockRequest = { ip: '127.0.0.1' }
        
        const r1 = limiter(mockRequest)
        const r2 = limiter(mockRequest)
        const r3 = limiter(mockRequest)
        const r4 = limiter(mockRequest)
        
        expect(r1.allowed).toBe(true)
        expect(r2.allowed).toBe(true)
        expect(r3.allowed).toBe(true)
        expect(r4.allowed).toBe(false)
        expect(r4.retryAfter).toBeGreaterThan(0)
    })
})
```

## Troubleshooting

### Rate limit not working
- Check that rate limit type exists in `lib/rate-limit.js`
- Verify IP is being extracted correctly from headers
- Check browser DevTools → Network → Headers for `X-RateLimit-*` headers

### Cache not working
- Verify `Cache-Control` header is in response
- Check browser DevTools → Network → Type for cached requests (should show `from cache`)
- For production, CDN must be enabled

### Performance not improving
- Verify database indexes were applied: `\d "Product"` in psql
- Check Prisma queries with `@prisma/internals` for N+1 problems
- Monitor connection pool with `SELECT count(*) FROM pg_stat_activity;`
