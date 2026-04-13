import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord } from '@/lib/security'
import { productDummyData } from '@/assets/assets'
import { createDevProduct, getPublicDevProducts, shouldAllowDevProductFileFallback, shouldUseDevProductFallback } from '@/lib/dev-product-fallback'

const isDevelopment = process.env.NODE_ENV !== 'production'

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

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const category = searchParams.get('category')

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

        const products = await prisma.product.findMany({
            where: {
                ...where,
                inStock: true
            },
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
                        sizes: Array.isArray(parsedSizes) ? parsedSizes : []
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

        return NextResponse.json(validProducts)
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

            return NextResponse.json([...devProducts, ...dummyProducts])
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

        if (!name || !description || !mrp || !price || !category || !images || images.length === 0) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                mrp: parseFloat(mrp),
                price: parseFloat(price),
                images: JSON.stringify(Array.isArray(images) ? images : []),
                sizes: JSON.stringify(Array.isArray(sizes) ? sizes : []),
                category,
                storeId: store.id
            },
            include: {
                store: true,
                rating: true
            }
        })

        // Parse the JSON strings for response
        return NextResponse.json({
            ...product,
            images: JSON.parse(product.images),
            sizes: JSON.parse(product.sizes)
        }, { status: 201 })
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