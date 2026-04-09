import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/security'

export async function GET() {
    try {
        const clerkUser = await getCurrentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find the user in our database, or create if not exists
        let user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
            // Create user if they don't exist
            user = await prisma.user.create({
                data: {
                    clerkId: clerkUser.id,
                    name: clerkUser.firstName + ' ' + clerkUser.lastName,
                    email: clerkUser.emailAddresses[0].emailAddress,
                    image: clerkUser.imageUrl
                }
            })
        }

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        })

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        // Get total products for this store
        const totalProducts = await prisma.product.count({
            where: { storeId: store.id }
        })

        // Get total orders for this store
        const totalOrders = await prisma.order.count({
            where: { storeId: store.id }
        })

        // Get total earnings from paid orders
        // For Razorpay: count orders where isPaid = true
        // For COD: count orders where status = 'DELIVERED' (payment received on delivery)
        const razorpayEarnings = await prisma.order.aggregate({
            _sum: {
                total: true
            },
            where: {
                storeId: store.id,
                paymentMethod: 'RAZORPAY',
                isPaid: true
            }
        })

        const codEarnings = await prisma.order.aggregate({
            _sum: {
                total: true
            },
            where: {
                storeId: store.id,
                paymentMethod: 'COD',
                status: 'DELIVERED'
            }
        })

        const totalEarnings = (razorpayEarnings._sum.total || 0) + (codEarnings._sum.total || 0)

        return NextResponse.json({
            totalProducts,
            totalOrders,
            totalEarnings
        })
    } catch (error) {
        console.error('Store dashboard error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}