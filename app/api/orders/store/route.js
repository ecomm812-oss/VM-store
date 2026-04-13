import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord, shouldUseDatabaseFallback } from '@/lib/security'
import { sendOrderStatusNotification } from '@/lib/email'

export async function GET() {
    try {
        const clerkUser = await getCurrentUser()
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

        const orders = await prisma.order.findMany({
            where: { storeId: store.id },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                },
                store: true,
                address: true,
                user: true
            },
            orderBy: { createdAt: 'desc' }
        })

        // Filter out orders that don't have orderItems (defensive programming)
        const validOrders = orders.filter(order => order.orderItems && order.orderItems.length > 0)

        return NextResponse.json(validOrders)
    } catch (error) {
        if (shouldUseDatabaseFallback(error)) {
            return NextResponse.json([])
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const clerkUser = await getCurrentUser()
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

        const { orderId, status } = await request.json()

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
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

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { 
                status: status,
                // For COD orders, mark as paid when delivered
                ...(status === 'DELIVERED' && order.paymentMethod === 'COD' && { isPaid: true })
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

        // Send customer notification email about status change
        await sendOrderStatusNotification(updatedOrder)

        return NextResponse.json(updatedOrder)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}