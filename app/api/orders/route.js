import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import Razorpay from 'razorpay'

export async function POST(request) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find the user in our database
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found. Please refresh and try again.' }, { status: 404 })
        }

        const { total, storeId, addressId, paymentMethod, orderItems, isCouponUsed, coupon } = await request.json()

        const order = await prisma.order.create({
            data: {
                total,
                userId: user.id,
                storeId,
                addressId,
                paymentMethod,
                isCouponUsed,
                coupon: JSON.stringify(coupon),
                orderItems: {
                    create: orderItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        selectedSize: item.selectedSize || 'One Size'
                    }))
                }
            },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            }
        })

        let razorpayOrder = null
        if (paymentMethod === 'RAZORPAY') {
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            })

            const options = {
                amount: Math.round(total * 100), // amount in paisa
                currency: 'INR',
                receipt: `order_${order.id}`,
            }

            razorpayOrder = await razorpay.orders.create(options)
        }

        return NextResponse.json({ order, razorpayOrder })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET() {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const orders = await prisma.order.findMany({
            where: { userId: clerkUser.id },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                },
                store: true,
                address: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(orders)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}