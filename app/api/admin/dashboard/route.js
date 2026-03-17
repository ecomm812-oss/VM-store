import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // Get total products
        const products = await prisma.product.count()

        // Get total stores
        const stores = await prisma.store.count()

        // Get total orders
        const orders = await prisma.order.count()

        // Get total revenue
        const revenueResult = await prisma.order.aggregate({
            _sum: {
                total: true
            },
            where: {
                status: 'DELIVERED'
            }
        })
        const revenue = revenueResult._sum.total || 0

        // Get recent orders for chart
        const allOrders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                store: true,
                user: true
            }
        })

        return NextResponse.json({
            products,
            revenue,
            orders,
            stores,
            allOrders
        })
    } catch (error) {
        console.error('Admin dashboard error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}