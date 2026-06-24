import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord, shouldUseDatabaseFallback } from '@/lib/security'
import Razorpay from 'razorpay'
import { checkRateLimit } from '@/lib/rateLimit'

function isProductColumnTypeMismatch(error) {
    const message = error?.message || ''
    return message.includes("Expected a string in column 'images'") ||
        message.includes("Expected a string in column 'sizes'") ||
        message.includes('malformed array literal') ||
        message.includes('Expected a string in column')
}

async function fetchProductByIdRaw(productId) {
    const [product] = await prisma.$queryRaw`
        SELECT
            id,
            name,
            price,
            "inStock",
            "storeId"
        FROM "Product"
        WHERE id = ${productId}
    `

    return product || null
}

async function loadProductForOrder(productId) {
    try {
        return await prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                name: true,
                price: true,
                inStock: true,
                storeId: true
            }
        })
    } catch (error) {
        if (isProductColumnTypeMismatch(error)) {
            return await fetchProductByIdRaw(productId)
        }
        throw error
    }
}

async function attachOrderItemProductNames(orders) {
    const productIds = [...new Set(
        orders.flatMap(order => (order.orderItems || []).map(item => item.productId)).filter(Boolean)
    )]

    if (productIds.length === 0) return orders

    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
            id: true,
            name: true
        }
    })

    const productMap = new Map(products.map(product => [product.id, product]))

    return orders.map(order => ({
        ...order,
        orderItems: (order.orderItems || []).map(item => ({
            ...item,
            product: productMap.get(item.productId) || { id: item.productId, name: 'Unknown Product' }
        }))
    }))
}

export async function POST(request) {
    try {
        const clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
            return NextResponse.json({ error: 'Authentication required.', code: 401 }, { status: 401 })
        }

        // Rate limiting: 10 orders per 15 minutes per user
        const rateLimit = checkRateLimit(`user:${clerkUser.id}`, { maxRequests: 10 })
        if (!rateLimit.allowed) {
            return NextResponse.json({
                error: 'Too many orders. Please try again later.',
                code: 429
            }, { status: 429 })
        }

        const user = await getOrCreateUserRecord({
            clerkId: clerkUser.id,
            fallbackName: 'User'
        })

        if (!user) {
            return NextResponse.json({ error: 'Authentication required.', code: 401 }, { status: 401 })
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

        // Validate that all products exist and are in stock, and calculate correct total
        let calculatedTotal = 0
        for (const item of orderItems) {
            const product = await loadProductForOrder(item.productId)

            if (!product) {
                return NextResponse.json({ error: `Product ${item.productId} not found`, code: 400 }, { status: 400 })
            }

            if (!product.inStock) {
                return NextResponse.json({ error: `Product ${product.name} is out of stock`, code: 400 }, { status: 400 })
            }

            if (product.storeId !== storeId) {
                return NextResponse.json({ error: `Product ${product.name} does not belong to this store`, code: 400 })
            }

            // Validate quantity
            if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
                return NextResponse.json({ error: `Invalid quantity for product ${product.name}`, code: 400 }, { status: 400 })
            }

            // Add to calculated total using the actual product price from database
            calculatedTotal += product.price * item.quantity
        }

        // Validate that submitted total matches calculated total (allow 1 cent tolerance for currency issues)
        const tolerance = 0.01
        if (Math.abs(calculatedTotal - total) > tolerance) {
            return NextResponse.json({
                error: 'Order total does not match item prices. Please refresh and try again.',
                code: 400
            }, { status: 400 })
        }

        // If Razorpay is selected, validate credentials before creating the order record.
        if (paymentMethod === 'RAZORPAY') {
            const razorpayKeyId = process.env.RAZORPAY_KEY_ID
            const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

            if (!razorpayKeyId || !razorpayKeySecret) {
                return NextResponse.json({
                    error: 'Razorpay is not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env and restart.',
                }, { status: 500 })
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
                        product: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        })

        let razorpayOrder = null
        if (paymentMethod === 'RAZORPAY') {
            const razorpayKeyId = process.env.RAZORPAY_KEY_ID
            const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

            // Already validated above; this is just a fallback
            if (!razorpayKeyId || !razorpayKeySecret) {
                return NextResponse.json({
                    error: 'Razorpay is not configured on the server. Please contact support.',
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
        if (shouldUseDatabaseFallback(error)) {
            return NextResponse.json([])
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET() {
    try {
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

        let orders
        try {
            orders = await prisma.order.findMany({
                where: { userId: user.id },
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
                    address: true
                },
                orderBy: { createdAt: 'desc' }
            })
        } catch (error) {
            if (!isProductColumnTypeMismatch(error)) {
                throw error
            }

            const fallbackOrders = await prisma.order.findMany({
                where: { userId: user.id },
                include: {
                    orderItems: true,
                    store: true,
                    address: true
                },
                orderBy: { createdAt: 'desc' }
            })

            orders = await attachOrderItemProductNames(fallbackOrders)
        }

        // Filter out orders that don't have orderItems (defensive programming)
        const validOrders = orders.filter(order => order.orderItems && order.orderItems.length > 0)

        return NextResponse.json(validOrders)
    } catch (error) {
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
            fallbackName: 'User'
        })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { orderId, isPaid, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await request.json()

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        // Verify the order belongs to the user
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: user.id
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
        }

        // If marking as paid, verify Razorpay payment if payment details provided
        if (isPaid && order.paymentMethod === 'RAZORPAY') {
            if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
                return NextResponse.json({ error: 'Payment verification details required for Razorpay payments' }, { status: 400 })
            }

            // Verify Razorpay payment signature
            const crypto = await import('crypto')
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpayOrderId}|${razorpayPaymentId}`)
                .digest('hex')

            if (expectedSignature !== razorpaySignature) {
                return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
            }
        }

        // Update the order
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { 
                isPaid: isPaid ?? order.isPaid,
                // You could also store payment details here if needed
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
                address: true
            }
        })

        return NextResponse.json(updatedOrder)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}