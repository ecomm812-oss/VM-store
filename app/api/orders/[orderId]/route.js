import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request, { params }) {
    try {
        const { orderId } = await params
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