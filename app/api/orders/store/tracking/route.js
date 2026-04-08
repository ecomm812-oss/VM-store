import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/security'

export async function GET(request) {
    try {
        const clerkUser = await getCurrentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get('orderId')

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        // Find user by clerkId
        let user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

        if (!order) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error('Error fetching order tracking:', error)
        return NextResponse.json({ error: 'Failed to fetch order tracking information' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const clerkUser = await getCurrentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let body
        try {
            body = await request.json()
        } catch (parseError) {
            console.error('Failed to parse request body:', parseError)
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
        }

        const { orderId, trackingNumber, trackingUrl, currentLocation, estimatedDelivery } = body

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        // Validate tracking URLs if provided
        if (trackingUrl) {
            try {
                new URL(trackingUrl)
            } catch (e) {
                return NextResponse.json({ error: 'Invalid tracking URL format' }, { status: 400 })
            }
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
                trackingNumber: trackingNumber && trackingNumber.trim() ? trackingNumber.trim() : null,
                trackingUrl: trackingUrl && trackingUrl.trim() ? trackingUrl.trim() : null,
                currentLocation: currentLocation && currentLocation.trim() ? currentLocation.trim() : null,
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
        return NextResponse.json({ error: 'Failed to update tracking information' }, { status: 500 })
    }
}