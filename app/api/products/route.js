import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord } from '@/lib/security'
import { productDummyData } from '@/assets/assets'
import { createDevProduct, getPublicDevProducts, shouldAllowDevProductFileFallback, shouldUseDevProductFallback, getDevProductById } from '@/lib/dev-product-fallback'

const isDevelopment = process.env.NODE_ENV !== 'production'

const LIST_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300'
}

function listJsonResponse(payload, init = {}) {
    return NextResponse.json(payload, {
        ...init,
        headers: {
            ...(init.headers || {}),
            ...LIST_CACHE_HEADERS
        }
    })
}

function normalizeStringArrayInput(value) {
    if (Array.isArray(value)) {
        return value
            .map(item => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
            .filter(Boolean)
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return []

        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
                return parsed
                    .map(item => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
                    .filter(Boolean)
            }
        } catch {
            // Keep raw string as a single item when it is not JSON.
        }

        return [trimmed]
    }

    return []
}

function isMalformedArrayLiteralError(error) {
    const message = error?.message || ''
    return message.includes('malformed array literal')
}

function normalizeProductResponse(product) {
    if (!product) return null

    // Handle images - could be array of strings or already normalized
    let images = product.images
    if (Array.isArray(images)) {
        images = images.filter(img => typeof img === 'string' && img.trim()).map(img => img.trim())
    } else if (typeof images === 'string') {
        images = normalizeStringArrayInput(images)
    } else {
        images = []
    }

    // Handle sizes - could be array of strings or JSON string
    let sizes = product.sizes
    if (Array.isArray(sizes)) {
        sizes = sizes.filter(size => typeof size === 'string' && size.trim()).map(size => size.trim())
    } else if (typeof sizes === 'string') {
        sizes = normalizeStringArrayInput(sizes)
    } else {
        sizes = []
    }

    // Ensure rating is an array
    const rating = Array.isArray(product.rating) ? product.rating : []

    // Build normalized product
    const normalized = {
        ...product,
        images,
        sizes,
        rating,
        // Ensure all required fields exist with defaults
        id: product.id || null,
        name: product.name || 'Unknown Product',
        description: product.description || '',
        price: product.price ?? 0,
        mrp: product.mrp ?? product.price ?? 0,
        category: product.category || 'Uncategorized',
        inStock: product.inStock !== false,
        store: product.store || null,
    }

    return normalized
}

function createFallbackProductId() {
    return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function toImageSrc(value) {
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
        if (typeof value.src === 'string') return value.src
        if (typeof value.default === 'string') return value.default
        if (value.default && typeof value.default.src === 'string') return value.default.src
    }
    return null
}

function normalizeFallbackProducts(products, search, category) {
    return products
        .map(product => ({
            ...product,
            images: Array.isArray(product.images) ? product.images.map(toImageSrc).filter(Boolean) : [],
            store: product.store ? {
                ...product.store,
                logo: toImageSrc(product.store.logo),
                user: product.store.user ? {
                    ...product.store.user,
                    image: toImageSrc(product.store.user.image)
                } : null
            } : null,
            rating: Array.isArray(product.rating)
                ? product.rating.map(entry => ({
                    ...entry,
                    user: entry.user ? {
                        ...entry.user,
                        image: toImageSrc(entry.user.image)
                    } : null
                }))
                : []
        }))
        .filter(product => product.images.length > 0)
        .filter(product => !search || product.name.toLowerCase().includes(search.toLowerCase()))
        .filter(product => !category || product.category === category)
}

function shouldUseFallback(error) {
    const message = error?.message || ''
    return isDevelopment && (
        error?.code === 'P1001' ||
        error?.code === 'ECONNREFUSED' ||
        message.includes('ECONNREFUSED') ||
        message.includes('Can\'t reach database server') ||
        message.includes('Environment variable not found: DATABASE_URL') ||
        message.includes('Invalid `prisma.') ||
        message.includes('error validating datasource')
    )
}

function isProductColumnTypeMismatch(error) {
    const message = error?.message || ''
    return message.includes("Expected a string in column 'images', got object") ||
        message.includes("Expected a string in column 'sizes', got object") ||
        message.includes('malformed array literal')
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const category = searchParams.get('category')
        const productId = searchParams.get('productId')

        const where = {}
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive'
            }
        }
        if (category) {
            where.category = category
        }

        // Product details view: fetch one product with full rating payload.
        if (productId) {
            console.log('[API] Fetching product:', productId)
            let product = null

            // First, try to fetch from database
            try {
                product = await prisma.product.findUnique({
                    where: { id: productId },
                    include: {
                        store: true,
                        rating: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        image: true
                                    }
                                }
                            },
                            orderBy: {
                                createdAt: 'desc'
                            }
                        }
                    }
                })

                if (product) {
                    const normalized = normalizeProductResponse(product)
                    console.log('[API] Product found in database:', normalized?.name)
                    return NextResponse.json(normalized, {
                        headers: {
                            'Cache-Control': 'private, no-store'
                        }
                    })
                }

                console.log('[API] Product not found in database:', productId)
            } catch (dbError) {
                // Log database errors for debugging
                console.error('[API] Product fetch error:', dbError?.message)
                
                // If database fails and we're in development, try fallback
                if (shouldUseDevProductFallback(dbError) && shouldAllowDevProductFileFallback()) {
                    console.warn('[API] Database unavailable for product details, trying dev fallback')
                    const devProduct = await getDevProductById(productId)
                    if (devProduct) {
                        const normalized = normalizeProductResponse(devProduct)
                        console.log('[API] Product found in dev fallback:', normalized?.name)
                        return NextResponse.json(normalized, {
                            headers: {
                                'Cache-Control': 'private, no-store'
                            }
                        })
                    }
                }
                
                // If it's a database error, rethrow
                if (shouldUseDevProductFallback(dbError)) {
                    throw dbError
                }
                // Otherwise continue to fallback
            }

            // Try dev fallback if database didn't return a product
            if (shouldAllowDevProductFileFallback()) {
                try {
                    console.log('[API] Trying dev fallback for product:', productId)
                    const devProduct = await getDevProductById(productId)
                    if (devProduct) {
                        const normalized = normalizeProductResponse(devProduct)
                        console.log('[API] Product found in dev fallback:', normalized?.name)
                        return NextResponse.json(normalized, {
                            headers: {
                                'Cache-Control': 'private, no-store'
                            }
                        })
                    }
                } catch (fallbackError) {
                    console.error('[API] Dev fallback error:', fallbackError?.message)
                    // Continue to return 404
                }
            }

            // Try dummy data as last resort
            console.log('[API] Trying dummy data fallback for product:', productId)
            const { productDummyData } = await import('@/assets/assets')
            const dummyProduct = productDummyData.find(p => p.id === productId)
            if (dummyProduct) {
                const normalized = normalizeProductResponse(dummyProduct)
                console.log('[API] Product found in dummy data:', normalized?.name)
                return NextResponse.json(normalized, {
                    headers: {
                        'Cache-Control': 'private, no-store'
                    }
                })
            }

            console.log('[API] Product not found anywhere:', productId)
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        let products
        try {
            products = await prisma.product.findMany({
                where: {
                    ...where,
                    inStock: true
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    mrp: true,
                    price: true,
                    images: true,
                    sizes: true,
                    category: true,
                    createdAt: true,
                    _count: {
                        select: {
                            rating: true
                        }
                    }
                }
            })
        } catch (queryError) {
            if (!isProductColumnTypeMismatch(queryError)) {
                throw queryError
            }

            const rawProducts = await prisma.$queryRaw`
                SELECT
                    p."id",
                    p."name",
                    p."description",
                    p."mrp",
                    p."price",
                    p."images",
                    p."sizes",
                    p."category",
                    p."createdAt",
                    COUNT(r."id")::int AS "ratingCount"
                FROM "Product" p
                LEFT JOIN "Rating" r ON r."productId" = p."id"
                WHERE p."inStock" = true
                GROUP BY
                    p."id",
                    p."name",
                    p."description",
                    p."mrp",
                    p."price",
                    p."images",
                    p."sizes",
                    p."category",
                    p."createdAt"
                ORDER BY p."createdAt" DESC
            `

            products = rawProducts
                .map((product) => ({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    mrp: product.mrp,
                    price: product.price,
                    images: product.images,
                    sizes: product.sizes,
                    category: product.category,
                    createdAt: product.createdAt,
                    _count: {
                        rating: product.ratingCount || 0
                    }
                }))
                .filter(product => !search || product.name.toLowerCase().includes(search.toLowerCase()))
                .filter(product => !category || product.category === category)
        }

        // Parse JSON fields safely and normalize legacy image shapes.
        const validProducts = products
            .map(product => {
                try {
                    const parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images
                    const parsedSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes

                    const normalizedImages = Array.isArray(parsedImages)
                        ? parsedImages
                            .map(image => {
                                if (typeof image === 'string') return image
                                if (image && typeof image === 'object') {
                                    return image.src || image.url || null
                                }
                                return null
                            })
                            .filter(Boolean)
                        : []

                    return {
                        ...product,
                        images: normalizedImages,
                        sizes: Array.isArray(parsedSizes) ? parsedSizes : [],
                        rating: [],
                        ratingCount: product?._count?.rating || 0,
                        averageRating: 0
                    }
                } catch (error) {
                    console.warn(`[API] Failed to parse JSON for product ${product.id}:`, error)
                    return null
                }
            })
            .filter(product => product && product.id && product.name && product.price !== undefined && product.images.length > 0)

        if (validProducts.length < products.length) {
            console.warn(`[API] Filtered out ${products.length - validProducts.length} invalid products`)
        }

        // If no valid products found and fallback is allowed, return dummy data
        if (validProducts.length === 0 && shouldAllowDevProductFileFallback()) {
            console.warn('[API] No valid products from database, using fallback data')
            const [dummyProducts, devProducts] = await Promise.all([
                normalizeFallbackProducts(productDummyData, search, category),
                getPublicDevProducts({ search: search || '', category: category || '' })
            ])
            return listJsonResponse([...devProducts, ...dummyProducts])
        }

        return listJsonResponse(validProducts)
    } catch (error) {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const category = searchParams.get('category')

        console.error('[API] Error fetching products:', error?.message)

        // Try fallback if database is unavailable
        if (shouldUseFallback(error) && shouldAllowDevProductFileFallback()) {
            console.warn('[API] Database unavailable in development, serving fallback products')
            try {
                const [dummyProducts, devProducts] = await Promise.all([
                    normalizeFallbackProducts(productDummyData, search, category),
                    getPublicDevProducts({ search: search || '', category: category || '' })
                ])
                return listJsonResponse([...devProducts, ...dummyProducts])
            } catch (fallbackError) {
                console.error('[API] Fallback failed:', fallbackError?.message)
            }
        }

        // If development mode, always return dummy data as last resort
        if (isDevelopment) {
            console.warn('[API] Error fetching products, using development fallback')
            try {
                const [dummyProducts, devProducts] = await Promise.all([
                    normalizeFallbackProducts(productDummyData, search, category),
                    getPublicDevProducts({ search: search || '', category: category || '' })
                ])
                return listJsonResponse([...devProducts, ...dummyProducts])
            } catch (fallbackError) {
                console.error('[API] Development fallback also failed:', fallbackError?.message)
            }
        }

        return NextResponse.json({ error: error?.message || 'Failed to fetch products' }, { status: 500 })
    }
}

export async function POST(request) {
    let body
    let clerkUser

    try {
        clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        body = await request.json()

        const user = await getOrCreateUserRecord({
            clerkId: clerkUser.id,
            fallbackName: 'Store Owner'
        })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        })

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        const { name, description, mrp, price, category, images, sizes } = body
        const normalizedImages = normalizeStringArrayInput(images)
        const normalizedSizes = normalizeStringArrayInput(sizes)

        if (!name || !description || !mrp || !price || !category || normalizedImages.length === 0) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const createData = {
            name,
            description,
            mrp: parseFloat(mrp),
            price: parseFloat(price),
            images: JSON.stringify(normalizedImages),
            sizes: JSON.stringify(normalizedSizes),
            category,
            storeId: store.id
        }

        let product
        try {
            product = await prisma.product.create({
                data: createData,
                include: {
                    store: true,
                    rating: true
                }
            })
        } catch (createError) {
            if (!isMalformedArrayLiteralError(createError)) {
                throw createError
            }

            // Some environments still use Postgres text[] columns for images/sizes.
            const fallbackProductId = createFallbackProductId()
            const insertedProducts = await prisma.$queryRaw`
                INSERT INTO "Product" (
                    "id",
                    "name",
                    "description",
                    "mrp",
                    "price",
                    "images",
                    "sizes",
                    "category",
                    "storeId",
                    "inStock",
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    ${fallbackProductId},
                    ${createData.name},
                    ${createData.description},
                    ${createData.mrp},
                    ${createData.price},
                    ${normalizedImages},
                    ${normalizedSizes},
                    ${createData.category},
                    ${createData.storeId},
                    ${true},
                    NOW(),
                    NOW()
                )
                RETURNING
                    "id",
                    "name",
                    "description",
                    "mrp",
                    "price",
                    "images",
                    "sizes",
                    "category",
                    "inStock",
                    "storeId",
                    "createdAt",
                    "updatedAt"
            `

            const insertedProduct = insertedProducts?.[0]
            if (!insertedProduct) {
                throw createError
            }

            product = {
                ...insertedProduct,
                store,
                rating: []
            }
        }

        // Support both JSON-string and native-array shapes in response.
        return NextResponse.json(normalizeProductResponse(product), { status: 201 })
    } catch (error) {
        if (shouldUseDevProductFallback(error) && clerkUser?.id && body) {
            try {
                const product = await createDevProduct({
                    clerkId: clerkUser.id,
                    name: body.name,
                    description: body.description,
                    mrp: body.mrp,
                    price: body.price,
                    category: body.category,
                    images: body.images,
                    sizes: body.sizes
                })

                return NextResponse.json(product, { status: 201 })
            } catch (fallbackError) {
                return NextResponse.json({ error: fallbackError.message }, { status: fallbackError.statusCode || 500 })
            }
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}