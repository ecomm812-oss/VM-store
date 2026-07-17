/**
 * Cache utility for managing response headers and caching strategy
 */

export const CACHE_DURATIONS = {
  // Short cache: 30 seconds, good for data that updates frequently
  SHORT: { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' },
  
  // Medium cache: 5 minutes, good for pages that update occasionally
  MEDIUM: { 'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800' },
  
  // Long cache: 1 hour, good for mostly static content
  LONG: { 'Cache-Control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400' },
  
  // No cache: use for sensitive or constantly changing data
  NO_CACHE: { 'Cache-Control': 'private, no-store, must-revalidate' },
  
  // Private cache: browser only, good for user-specific data
  PRIVATE: { 'Cache-Control': 'private, max-age=300' },
}

/**
 * Create cache headers for a response
 * @param {Object} response - NextResponse object
 * @param {string} duration - Cache duration key (SHORT, MEDIUM, LONG, NO_CACHE, PRIVATE)
 * @returns {Object} response with cache headers
 */
export function withCacheHeaders(response, duration = 'MEDIUM') {
  const headers = CACHE_DURATIONS[duration] || CACHE_DURATIONS.MEDIUM
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Cache key generator for consistent key naming
 */
export const CACHE_KEYS = {
  PRODUCTS_LIST: (search = '', category = '') => `products:${search}:${category}`,
  PRODUCT_DETAIL: (productId) => `product:${productId}`,
  STORES_LIST: () => 'stores:all',
  STORE_DETAIL: (storeId) => `store:${storeId}`,
  ORDERS_USER: (userId) => `orders:user:${userId}`,
  RATINGS_PRODUCT: (productId) => `ratings:product:${productId}`,
  DASHBOARD_DATA: () => 'dashboard:data',
}
