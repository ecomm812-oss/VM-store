import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dummyStoreData, productDummyData } from '@/assets/assets'
import { getDevProductsByStoreId, shouldUseDevProductFallback } from '@/lib/dev-product-fallback'
import { getDevStoreByUsername, shouldUseDevStoreFallback } from '@/lib/dev-store-fallback'

function toImageSrc(value) {
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
        if (typeof value.src === 'string') return value.src
        if (typeof value.default === 'string') return value.default
        if (value.default && typeof value.default.src === 'string') return value.default.src
    }
    return null
}

function normalizeFallbackProducts(products) {
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
}

export async function GET(request, { params }) {
    let username

    try {
        const resolvedParams = await params
        username = resolvedParams.username

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 })
        }

        // Find store by username
        const store = await prisma.store.findUnique({
            where: { username: username }
        })

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        // Get products for this store
        const products = await prisma.product.findMany({
            where: {
                storeId: store.id,
                inStock: true
            },
            include: {
                store: true,
                rating: true
            }
        })

        // Parse JSON string fields
        const parsedProducts = products.map(product => ({
            ...product,
            images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
            sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes
        }))

        return NextResponse.json({
            store,
            products: parsedProducts
        })
    } catch (error) {
        console.error('Store shop error:', error)
        return NextResponse.json({ error: error.message || 'Failed to fetch store products' }, { status: 500 })
    }
}