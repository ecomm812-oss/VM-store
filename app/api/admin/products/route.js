import { NextResponse, revalidatePath } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminUser, createSecureErrorResponse } from '@/lib/security'

const CACHE_HEADERS = {
    'Cache-Control': 'no-store'
}

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
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                category: true,
                inStock: true,
                createdAt: true,
                storeId: true,
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

        const response = NextResponse.json(products)
        
        // Add cache headers
        Object.entries(CACHE_HEADERS).forEach(([key, value]) => {
            response.headers.set(key, value)
        })
        
        return response
    } catch (error) {
        console.error('Admin products fetch error:', error)
        return createSecureErrorResponse('fetching products', 500)
    }
}

async function updateProduct(request) {
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

    const { productId, inStock, price } = await request.json()

    if (!productId || (typeof inStock !== 'boolean' && typeof price !== 'number')) {
        return createSecureErrorResponse('product update', 400)
    }

    if (typeof price === 'number' && (!Number.isFinite(price) || price < 0)) {
        return createSecureErrorResponse('product price', 400)
    }

    const updateData = {}
    if (typeof inStock === 'boolean') updateData.inStock = inStock
    if (typeof price === 'number') updateData.price = price

    const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData,
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

    revalidatePath('/')

    return NextResponse.json(updatedProduct)
}

export async function PATCH(request) {
    try {
        return await updateProduct(request)
    } catch (error) {
        console.error('Admin products update error:', error)
        return createSecureErrorResponse('updating product', 500)
    }
}

export const PUT = PATCH
