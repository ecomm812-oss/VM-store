import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/security'
import { getDevProductsByClerkId, shouldUseDevProductFallback, updateDevProductStock } from '@/lib/dev-product-fallback'

export async function GET() {
    let clerkUser

    try {
        clerkUser = await getCurrentUser()
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
        if (shouldUseDevProductFallback(error) && clerkUser?.id) {
            const products = await getDevProductsByClerkId(clerkUser.id)
            return NextResponse.json(products)
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request) {
    let clerkUser
    let requestBody

    try {
        clerkUser = await getCurrentUser()
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

        requestBody = await request.json()
        const { productId, inStock } = requestBody

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