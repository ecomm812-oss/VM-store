import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord } from '@/lib/security'
import { getDevProductsByClerkId, shouldUseDevProductFallback, updateDevProductStock } from '@/lib/dev-product-fallback'

function isProductColumnTypeMismatch(error) {
    const message = error?.message || ''
    return message.includes("Expected a string in column 'images', got object") ||
        message.includes('malformed array literal')
}

function normalizeStringArrayField(value) {
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
            // Preserve non-JSON string values as single-item arrays.
        }

        return [trimmed]
    }

    return []
}

function toImageSrc(value) {
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
        if (typeof value.src === 'string') return value.src
        if (typeof value.url === 'string') return value.url
        if (typeof value.default === 'string') return value.default
        if (value.default && typeof value.default.src === 'string') return value.default.src
    }
    return null
}

function normalizeProductForResponse(product) {
    return {
        ...product,
        images: normalizeStringArrayField(product.images).map(image => toImageSrc(image)).filter(Boolean),
        sizes: normalizeStringArrayField(product.sizes),
        deliveryCharge: Number(product.deliveryCharge || 0)
    }
}

export async function GET() {
    let clerkUser

    try {
        clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

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

        let products
        try {
            products = await prisma.product.findMany({
                where: { storeId: store.id },
                include: {
                    store: true,
                    rating: true
                },
                orderBy: { createdAt: 'desc' }
            })
        } catch (productError) {
            if (!isProductColumnTypeMismatch(productError)) {
                throw productError
            }

            const rawProducts = await prisma.$queryRaw`
                SELECT
                    id,
                    name,
                    description,
                    mrp,
                    price,
                    "deliveryCharge",
                    images,
                    sizes,
                    category,
                    "inStock",
                    "storeId",
                    "createdAt",
                    "updatedAt"
                FROM "Product"
                WHERE "storeId" = ${store.id}
                ORDER BY "createdAt" DESC
            `

            products = rawProducts.map(product => ({
                ...product,
                store,
                rating: []
            }))
        }

        return NextResponse.json(products.map(normalizeProductForResponse))
    } catch (error) {
        if (shouldUseDevProductFallback(error) && clerkUser?.id) {
            const products = await getDevProductsByClerkId(clerkUser.id)
            return NextResponse.json(products)
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request) {
    let clerkUser
    let requestBody

    try {
        clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

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

        requestBody = await request.json()
        const { productId, inStock } = requestBody

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        if (typeof inStock !== 'boolean') {
            return NextResponse.json({ error: 'inStock must be a boolean' }, { status: 400 })
        }

        // Verify the product belongs to the user's store
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                storeId: store.id
            },
            select: {
                id: true,
                inStock: true
            }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 })
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { inStock },
            select: {
                id: true,
                inStock: true
            }
        })

        return NextResponse.json(updatedProduct)
    } catch (error) {
        if (shouldUseDevProductFallback(error) && clerkUser?.id && requestBody?.productId) {
            try {
                const updatedProduct = await updateDevProductStock({
                    clerkId: clerkUser.id,
                    productId: requestBody.productId,
                    inStock: requestBody.inStock
                })

                return NextResponse.json(updatedProduct)
            } catch (fallbackError) {
                return NextResponse.json({ error: fallbackError.message }, { status: fallbackError.statusCode || 500 })
            }
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}