import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord } from '@/lib/security'
import { productDummyData } from '@/assets/assets'
import { createDevProduct, getPublicDevProducts, shouldAllowDevProductFileFallback, shouldUseDevProductFallback } from '@/lib/dev-product-fallback'

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

function parseMaybeJsonArray(value) {
    if (Array.isArray(value)) return value
    if (typeof value !== 'string') return []

    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function isMalformedArrayLiteralError(error) {
    const message = error?.message || ''
    return message.includes('malformed array literal')
}

function normalizeProductResponse(product) {
    return {
        ...product,
        images: normalizeStringArrayInput(product.images),
        sizes: normalizeStringArrayInput(product.sizes)
    }
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
            const product = await prisma.product.findUnique({
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

            if (!product) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 })
            }

            return NextResponse.json(normalizeProductResponse(product), {
                headers: {
                    'Cache-Control': 'private, no-store'
                }
            })
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

        return listJsonResponse(validProducts)
    } catch (error) {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const category = searchParams.get('category')

        if (shouldUseFallback(error) && shouldAllowDevProductFileFallback()) {
            console.warn('[API] Database unavailable in development, serving fallback products')
            const [dummyProducts, devProducts] = await Promise.all([
                normalizeFallbackProducts(productDummyData, search, category),
                getPublicDevProducts({ search: search || '', category: category || '' })
            ])

            return listJsonResponse([...devProducts, ...dummyProducts])
        }

        console.error('[API] Error fetching products:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
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