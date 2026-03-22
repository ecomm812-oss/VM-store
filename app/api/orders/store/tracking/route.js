import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function PUT(request) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Auto-create user if not exists
        let user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    clerkId: clerkUser.id,
                    email: clerkUser.emailAddresses[0]?.emailAddress || '',
                    name: clerkUser.firstName + ' ' + clerkUser.lastName || '',
                }
            })
        }

        const { orderId, trackingNumber, trackingUrl, currentLocation, estimatedDelivery } = await request.json()

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        // Verify the store belongs to the user
        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        })

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        // Verify the order belongs to the user's store
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                storeId: store.id
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
        }

        // Update tracking information
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                trackingNumber: trackingNumber || null,
                trackingUrl: trackingUrl || null,
                currentLocation: currentLocation || null,
                estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null
            },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                },
                store: true,
                address: true,
                user: true
            }
        })

        return NextResponse.json(updatedOrder)
    } catch (error) {
        console.error('Error updating tracking information:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}