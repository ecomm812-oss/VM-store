import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find the user in our database
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found. Please refresh and try again.' }, { status: 404 })
        }

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        })

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        const products = await prisma.product.findMany({
            where: { storeId: store.id },
            include: {
                store: true,
                rating: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(products)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found. Please refresh and try again.' }, { status: 404 })
        }

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        })

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        const { productId, inStock } = await request.json()

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        // Verify the product belongs to the user's store
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                storeId: store.id
            }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 })
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { inStock: inStock }
        })

        return NextResponse.json(updatedProduct)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}