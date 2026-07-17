import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminUser } from '@/lib/security'

// Cache dashboard data for 1 minute in production
const CACHE_HEADERS = {
    'Cache-Control': 'private, max-age=60, s-maxage=300'
}

export async function GET() {
    try {
        const isAdmin = await isAdminUser()
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use Promise.all to parallelize queries for better performance
        const [products, stores, orders, revenueResult, allOrders, productDetails, orderDetails] = await Promise.all([
            // Get total products count
            prisma.product.count(),
            
            // Get total stores count
            prisma.store.count(),
            
            // Get total orders count
            prisma.order.count(),
            
            // Get total revenue (only select needed fields)
            prisma.order.aggregate({
                _sum: { total: true },
                where: { status: 'DELIVERED' }
            }),
            
            // Get recent orders (select only needed fields)
            prisma.order.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    total: true,
                    status: true,
                    createdAt: true,
                    store: { select: { id: true, name: true } },
                    user: { select: { id: true, name: true } }
                }
            }),
            
            // Get recent products (select only needed fields)
            prisma.product.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    createdAt: true,
                    store: { select: { id: true, name: true } }
                }
            }),
            
            // Get recent orders with items (select only needed fields)
            prisma.order.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    total: true,
                    status: true,
                    createdAt: true,
                    store: { select: { id: true, name: true } },
                    orderItems: {
                        select: {
                            id: true,
                            quantity: true,
                            price: true,
                            product: { select: { id: true, name: true } }
                        }
                    }
                }
            })
        ])

        const revenue = revenueResult._sum.total || 0

        const response = NextResponse.json({
            products,
            revenue,
            orders,
            stores,
            allOrders,
            productDetails,
            orderDetails
        })

        // Add cache headers
        Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
            response.headers.set(key, value)
        })

        return response
    } catch (error) {
        console.error('Admin dashboard error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}