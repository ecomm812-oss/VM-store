import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/security'

export async function POST(request) {
    try {
        const clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find the user in our database
        let user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const body = await request.json()
        const { rating, review, productId, orderId } = body

        if (!rating || !productId || !orderId) {
            return NextResponse.json({ error: 'Rating, productId, and orderId are required' }, { status: 400 })
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
        }

        // Check if user has already rated this product for this order
        const existingRating = await prisma.rating.findUnique({
            where: {
                userId_productId_orderId: {
                    userId: user.id,
                    productId: productId,
                    orderId: orderId
                }
            }
        })

        if (existingRating) {
            return NextResponse.json({ error: 'You have already rated this product for this order' }, { status: 400 })
        }

        // Check if the order belongs to the user and is delivered
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: user.id,
                status: 'DELIVERED'
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found or not eligible for rating' }, { status: 404 })
        }

        // Check if the product is in the order
        const orderItem = await prisma.orderItem.findFirst({
            where: {
                orderId: orderId,
                productId: productId
            }
        })

        if (!orderItem) {
            return NextResponse.json({ error: 'Product not found in this order' }, { status: 404 })
        }

        // Create the rating
        const newRating = await prisma.rating.create({
            data: {
                rating: parseInt(rating),
                review: review || '',
                userId: user.id,
                productId: productId,
                orderId: orderId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        })

        return NextResponse.json(newRating)
    } catch (error) {
        console.error('[API] Error creating rating:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}