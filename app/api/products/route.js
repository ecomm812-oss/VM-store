import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord } from '@/lib/security'
import { createDevProduct, getPublicDevProducts, shouldUseDevProductFallback, getDevProductById } from '@/lib/dev-product-fallback'
import { normalizeProductResponse, toImageSrc } from '@/lib/product-utils'

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

function isMalformedArrayLiteralError(error) {
    const message = error?.message || ''
    return message.includes('malformed array literal')
}

function createFallbackProductId() {
    return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
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
                console.error('[API] Database error for product:', dbError?.message)
            }

            if (isDevelopment) {
                try {
                    const devProduct = await getDevProductById(productId)
                    if (devProduct) {
                        console.log('[API] Returning dev fallback product for:', productId)
                        return NextResponse.json(devProduct, {
                            headers: {
                                'Cache-Control': 'private, no-store'
                            }
                        })
                    }
                } catch (devError) {
                    console.error('[API] Dev fallback error fetching product:', devError?.message)
                }
            }

            console.log('[API] Product not found in any source:', productId)
            return NextResponse.json({
                error: 'Product not found',
                message: `Product with ID '${productId}' was not found in database.`
            }, { status: 404 })
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
        console.error('[API] Error fetching products:', error?.message)
        if (shouldUseDevProductFallback(error)) {
            try {
                const fallbackProducts = await getPublicDevProducts({ search: search || '', category: category || '' })
                console.warn('[API] Using development product fallback due to database error')
                return listJsonResponse(normalizeFallbackProducts(fallbackProducts, search, category))
            } catch (fallbackError) {
                console.error('[API] Dev fallback error:', fallbackError?.message)
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