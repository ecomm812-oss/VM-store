import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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