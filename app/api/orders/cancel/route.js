import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord } from '@/lib/security'
import { OrderStatus } from '@prisma/client'
import { sendOrderStatusNotification } from '@/lib/email'

export async function PUT(request) {
    try {
        console.log('Cancel order API called');

        const clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
            console.log('No clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('Clerk user:', clerkUser.id);

        const user = await getOrCreateUserRecord({
            clerkId: clerkUser.id,
            fallbackName: 'User'
        })

        if (!user) {
            console.log('User could not be resolved');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('User found/created:', user.id);

        const body = await request.json()
        console.log('Request body:', body);

        const { orderId } = body

        if (!orderId) {
            console.log('No orderId provided');
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        console.log('Order ID:', orderId);

        // Find the order and verify it belongs to the user
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: user.id
            }
        })

        console.log('Order found:', order ? 'yes' : 'no');

        if (!order) {
            console.log('Order not found for user');
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        console.log('Order status:', order.status);

        // Check if order can be cancelled
        if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
            console.log('Order cannot be cancelled - status:', order.status);
            return NextResponse.json({
                error: 'Order cannot be cancelled at this stage'
            }, { status: 400 })
        }

        console.log('Attempting to update order status to CANCELLED');

        // Update order status to CANCELLED
        try {
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.CANCELLED,
                    updatedAt: new Date()
                },
                include: {
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    store: true,
                    address: true,
                    user: true
                }
            })

            console.log('Order updated successfully');
            console.log('Updated order status:', updatedOrder.status);

            // Send cancellation notification email to customer
            await sendOrderStatusNotification(updatedOrder)

            return NextResponse.json({
                message: 'Order cancelled successfully',
                order: updatedOrder
            })
        } catch (updateError) {
            console.error('Error updating order:', updateError);
            return NextResponse.json({
                error: `Failed to update order: ${updateError.message}`
            }, { status: 500 })
        }
    } catch (error) {
        console.error('Error cancelling order:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}