import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminUser, createSecureErrorResponse } from '@/lib/security'

export async function GET() {
    try {
        const isDevMode = process.env.NODE_ENV !== 'production' && (
            !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
            !process.env.CLERK_SECRET_KEY ||
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'your_clerk_key_here' ||
            process.env.CLERK_SECRET_KEY === 'your_clerk_secret_here'
        )

        if (!isDevMode) {
            const isAdmin = await isAdminUser()
            if (!isAdmin) {
                return createSecureErrorResponse('admin access', 403)
            }
        }

        const products = await prisma.product.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        isActive: true
                    }
                }
            }
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error('Admin products fetch error:', error)
        return createSecureErrorResponse('fetching products', 500)
    }
}

export async function PATCH(request) {
    try {
        const isDevMode = process.env.NODE_ENV !== 'production' && (
            !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
            !process.env.CLERK_SECRET_KEY ||
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'your_clerk_key_here' ||
            process.env.CLERK_SECRET_KEY === 'your_clerk_secret_here'
        )

        if (!isDevMode) {
            const isAdmin = await isAdminUser()
            if (!isAdmin) {
                return createSecureErrorResponse('admin access', 403)
            }
        }

        const { productId, inStock } = await request.json()

        if (!productId || typeof inStock !== 'boolean') {
            return createSecureErrorResponse('product update', 400)
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { inStock },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        isActive: true
                    }
                }
            }
        })

        return NextResponse.json(updatedProduct)
    } catch (error) {
        console.error('Admin products update error:', error)
        return createSecureErrorResponse('updating product', 500)
    }
}
