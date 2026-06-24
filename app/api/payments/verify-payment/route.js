import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord } from '@/lib/security'

export async function POST(request) {
    try {
        const clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
        }

        const user = await getOrCreateUserRecord({
            clerkId: clerkUser.id,
            fallbackName: 'User'
        })

        if (!user) {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
        }

        const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await request.json()

        if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            return NextResponse.json({ error: 'Missing payment verification fields.' }, { status: 400 })
        }

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: user.id,
                paymentMethod: 'RAZORPAY'
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found or access denied.' }, { status: 404 })
        }

        const crypto = await import('crypto')
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex')

        if (expectedSignature !== razorpaySignature) {
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                isPaid: true
            }
        })

        return NextResponse.json({ success: true, order: updatedOrder })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
