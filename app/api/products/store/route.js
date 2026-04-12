import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/security'

export async function GET() {
    try {
        const clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find the user in our database, or create if not exists
        let user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
            // Create user if they don't exist
            user = await prisma.user.create({
                data: {
                    clerkId: clerkUser.id,
                    name: clerkUser.firstName + ' ' + clerkUser.lastName,
                    email: clerkUser.emailAddresses[0].emailAddress,
                    image: clerkUser.imageUrl
                }
            })
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

        // Parse JSON string fields
        const parsedProducts = products.map(product => ({
            ...product,
            images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
            sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes
        }))

        return NextResponse.json(parsedProducts)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find the user in our database, or create if not exists
        let user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
            // Create user if they don't exist
            user = await prisma.user.create({
                data: {
                    clerkId: clerkUser.id,
                    name: clerkUser.firstName + ' ' + clerkUser.lastName,
                    email: clerkUser.emailAddresses[0].emailAddress,
                    image: clerkUser.imageUrl
                }
            })
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