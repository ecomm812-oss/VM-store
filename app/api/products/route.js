import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord } from '@/lib/security'
import { createDevProduct, getPublicDevProducts, shouldUseDevProductFallback, getDevProductById } from '@/lib/dev-product-fallback'
import { normalizeProductResponse, normalizeStringArrayInput, toImageSrc } from '@/lib/product-utils'

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

async function fetchProductByIdRaw(productId) {
    const [product] = await prisma.$queryRaw`
        SELECT
            p."id",
            p."name",
            p."description",
            p."mrp",
            p."price",
            p."deliveryCharge",
            p."images",
            p."sizes",
            p."category",
            p."inStock",
            p."storeId",
            p."createdAt",
            p."updatedAt"
        FROM "Product" p
        WHERE p."id" = ${productId}
    `

    if (!product) return null

    return normalizeProductResponse({
        ...product,
        rating: [],
        store: null
    })
}

function isProductColumnTypeMismatch(error) {
    const message = error?.message || ''
    return message.includes("Expected a string in column 'images'") ||
        message.includes("Expected a string in column 'sizes'") ||
        message.includes('malformed array literal') ||
        message.includes('Expected a string in column')
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
                if (isProductColumnTypeMismatch(dbError)) {
                    console.log('[API] Product detail type mismatch, using raw fallback for:', productId)
                    const fallbackProduct = await fetchProductByIdRaw(productId)
                    if (fallbackProduct) {
                        return NextResponse.json(fallbackProduct, {
                            headers: {
                                'Cache-Control': 'private, no-store'
                            }
                        })
                    }
                }
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
            console.log('[API] Starting product fetch with params:', { search, category })
            products = await prisma.product.findMany({
                where: {
                    ...where,
                    inStock: true
                },
                include: {
                    store: {
                        select: {
                            id: true
                        }
                    },
                    _count: {
                        select: {
                            rating: true
                        }
                    }
                }
            })
            
            // Transform to flat structure with storeId
            products = products.map(p => ({
                ...p,
                storeId: p.store?.id || p.storeId || null,
                store: undefined
            }))
            
            console.log('[API] Successfully fetched', products.length, 'products from database')
        } catch (queryError) {
            console.error('[API] Query error in findMany:', queryError?.message)
            if (!isProductColumnTypeMismatch(queryError)) {
                throw queryError
            }

            // Fallback to raw query if Prisma has type issues
            console.log('[API] Using raw SQL fallback due to type mismatch')
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
                    p."storeId",
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
                    p."storeId",
                    p."createdAt"
                ORDER BY p."createdAt" DESC
            `
            console.log('[API] Raw query returned', rawProducts.length, 'products')

            products = rawProducts
                .map((product) => ({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    mrp: product.mrp,
                    price: product.price,
                    deliveryCharge: product.deliveryCharge,
                    images: product.images,
                    sizes: product.sizes,
                    category: product.category,
                    storeId: product.storeId,
                    createdAt: product.createdAt,
                    _count: {
                        rating: product.ratingCount || 0
                    }
                }))
                .filter(product => !search || product.name.toLowerCase().includes(search.toLowerCase()))
                .filter(product => !category || product.category === category)
            console.log('[API] Mapped to', products.length, 'products after filtering')
        }

        // Parse JSON fields safely and normalize legacy image shapes.
        console.log('[API] Starting normalization of', products.length, 'products')
        const validProducts = products
            .map(product => {
                try {
                    const imagesValue = product.images
                    const sizesValue = product.sizes

                    const parsedImages = typeof imagesValue === 'string'
                        ? normalizeStringArrayInput(imagesValue)
                        : Array.isArray(imagesValue)
                            ? imagesValue
                            : imagesValue && typeof imagesValue === 'object'
                                ? Object.values(imagesValue)
                                : []

                    const normalizedImages = parsedImages
                        .flatMap(image => Array.isArray(image) ? image : [image])
                        .map(image => toImageSrc(image))
                        .filter(Boolean)

                    const parsedSizes = typeof sizesValue === 'string'
                        ? normalizeStringArrayInput(sizesValue)
                        : Array.isArray(sizesValue)
                            ? sizesValue
                            : sizesValue && typeof sizesValue === 'object'
                                ? Object.values(sizesValue)
                                : []

                    const normalizedSizes = Array.isArray(parsedSizes)
                        ? parsedSizes.map(size => (typeof size === 'string' ? size.trim() : String(size || '').trim())).filter(Boolean)
                        : []

                    return {
                        ...product,
                        images: normalizedImages,
                        sizes: normalizedSizes,
                        deliveryCharge: Number(product.deliveryCharge || 0),
                        rating: [],
                        ratingCount: product?._count?.rating || 0,
                        averageRating: 0
                    }
                } catch (error) {
                    console.warn(`[API] Failed to normalize product ${product.id}:`, error?.message)
                    return null
                }
            })
            .filter(product => product && product.id && product.name && product.price !== undefined)

        console.log('[API] Normalized to', validProducts.length, 'valid products')
        if (validProducts.length < products.length) {
            console.warn(`[API] Filtered out ${products.length - validProducts.length} invalid products`)
        }

        console.log('[API] Returning response with', validProducts.length, 'products')
        return listJsonResponse(validProducts)
    } catch (error) {
        console.error('[API] ===== PRODUCTS ERROR START =====')
        console.error('[API] Error type:', error?.constructor?.name)
        console.error('[API] Error message:', error?.message)
        console.error('[API] Error stack:', error?.stack)
        console.error('[API] Full error object:', JSON.stringify(error, null, 2))
        console.error('[API] ===== PRODUCTS ERROR END =====')
        
        if (shouldUseDevProductFallback(error)) {
            try {
                console.log('[API] Attempting dev fallback...')
                const fallbackProducts = await getPublicDevProducts({ search: search || '', category: category || '' })
                console.warn('[API] Using development product fallback due to database error')
                return listJsonResponse(fallbackProducts)
            } catch (fallbackError) {
                console.error('[API] Dev fallback error:', fallbackError?.message)
                console.error('[API] Dev fallback stack:', fallbackError?.stack)
            }
        }
        
        const errorMessage = error?.message || 'Failed to fetch products'
        console.error('[API] Returning 500 with error message:', errorMessage)
        return NextResponse.json({ error: errorMessage }, { status: 500 })
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

        const { name, description, mrp, price, deliveryCharge, category, images, sizes } = body
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
            deliveryCharge: parseFloat(deliveryCharge || 0),
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
                    "deliveryCharge",
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
                    ${createData.deliveryCharge},
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