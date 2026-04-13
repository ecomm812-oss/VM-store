import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord } from '@/lib/security'

export async function GET(request, { params }) {
    try {
        const { orderId } = await params
        const clerkUser = await getCurrentUser()

        if (!clerkUser?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await getOrCreateUserRecord({
            clerkId: clerkUser.id,
            fallbackName: 'User'
        })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch the specific order with all related data
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: user.id // Ensure user can only access their own orders
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
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error('Error fetching order:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}