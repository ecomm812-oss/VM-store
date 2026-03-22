import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
    try {
        const { username } = await params

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

        return NextResponse.json({
            store,
            products
        })
    } catch (error) {
        console.error('Store shop error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}