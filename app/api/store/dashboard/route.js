import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getOrCreateUserRecord } from '@/lib/security'
import { getDevStoreByClerkId, shouldUseDevStoreFallback } from '@/lib/dev-store-fallback'

const emptyDashboard = {
    totalProducts: 0,
    totalOrders: 0,
    totalEarnings: 0
}

export async function GET() {
    try {
        const user = await getOrCreateUserRecord({ fallbackName: 'Store Owner' })
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        })

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        const totalProducts = await prisma.product.count({
            where: { storeId: store.id }
        })

        const totalOrders = await prisma.order.count({
            where: { storeId: store.id }
        })

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
        if (shouldUseDevStoreFallback(error)) {
            const clerkUser = await getCurrentUser()
            if (!clerkUser?.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            await getDevStoreByClerkId(clerkUser.id)
            return NextResponse.json(emptyDashboard)
        }

        console.error('Store dashboard error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
