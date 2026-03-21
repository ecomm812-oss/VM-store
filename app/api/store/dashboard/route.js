import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request) {
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

        // Get total earnings from delivered orders
        const earningsResult = await prisma.order.aggregate({
            _sum: {
                total: true
            },
            where: {
                storeId: store.id,
                status: 'DELIVERED'
            }
        })
        const totalEarnings = earningsResult._sum.total || 0

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