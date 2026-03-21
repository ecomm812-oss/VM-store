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

        // Validate required fields
        if (!total || !storeId || !addressId || !paymentMethod || !orderItems || orderItems.length === 0) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        // Validate that the address exists and belongs to the user
        const address = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId: user.id
            }
        })

        if (!address) {
            return NextResponse.json({ error: 'Invalid address. Please select a valid address.' }, { status: 400 })
        }

        // Validate that the store exists
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        })

        if (!store) {
            return NextResponse.json({ error: 'Invalid store' }, { status: 400 })
        }

        // Validate that all products exist and are in stock
        for (const item of orderItems) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId }
            })

            if (!product) {
                return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
            }

            if (!product.inStock) {
                return NextResponse.json({ error: `Product ${product.name} is out of stock` }, { status: 400 })
            }

            if (product.storeId !== storeId) {
                return NextResponse.json({ error: `Product ${product.name} does not belong to this store` }, { status: 400 })
            }
        }

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
            // Validate Razorpay credentials
            const razorpayKeyId = process.env.RAZORPAY_KEY_ID
            const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

            if (!razorpayKeyId || !razorpayKeySecret) {
                return NextResponse.json({ 
                    error: 'Payment gateway configuration error. Please contact support.' 
                }, { status: 500 })
            }

            try {
                const razorpay = new Razorpay({
                    key_id: razorpayKeyId,
                    key_secret: razorpayKeySecret,
                })

                const options = {
                    amount: Math.round(total * 100), // amount in paisa
                    currency: 'INR',
                    receipt: `order_${order.id}`,
                }

                razorpayOrder = await razorpay.orders.create(options)
            } catch (razorpayError) {
                console.error('Razorpay Error:', razorpayError)
                return NextResponse.json({ 
                    error: `Payment gateway error: ${razorpayError.message}` 
                }, { status: 500 })
            }
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