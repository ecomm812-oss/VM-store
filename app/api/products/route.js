import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const category = searchParams.get('category')

        const where = {}
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive'
            }
        }
        if (category) {
            where.category = category
        }

        const products = await prisma.product.findMany({
            where: {
                ...where,
                inStock: true
            },
            include: {
                store: true,
                rating: true
            }
        })

        // Validate products - filter out any with missing required fields
        const validProducts = products.filter(product => {
            return (
                product &&
                product.id &&
                product.name &&
                product.price !== undefined &&
                product.images &&
                Array.isArray(product.images) &&
                product.images.length > 0 &&
                product.category &&
                product.storeId &&
                product.store &&
                product.store.id
            )
        })

        if (validProducts.length < products.length) {
            console.warn(`[API] Filtered out ${products.length - validProducts.length} invalid products`)
        }

        return NextResponse.json(validProducts)
    } catch (error) {
        console.error('[API] Error fetching products:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

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

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        })

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        const body = await request.json()
        const { name, description, mrp, price, category, images } = body

        if (!name || !description || !mrp || !price || !category || !images || images.length === 0) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                mrp: parseFloat(mrp),
                price: parseFloat(price),
                images,
                category,
                storeId: store.id
            }
        })

        return NextResponse.json(product, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}