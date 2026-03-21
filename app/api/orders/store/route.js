import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request) {
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

        return NextResponse.json(orders)
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
            data: { status: status }
        })

        return NextResponse.json(updatedOrder)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}