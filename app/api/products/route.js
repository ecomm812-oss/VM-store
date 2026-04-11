import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/security'

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
                rating: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })

        // Parse JSON string fields and validate products
        const validProducts = products
            .map(product => {
                try {
                    return {
                        ...product,
                        images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
                        sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes
                    }
                } catch (error) {
                    console.warn(`[API] Failed to parse JSON for product ${product.id}:`, error)
                    return null
                }
            })
            .filter(product => {
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

        const body = await request.json()
        const { name, description, mrp, price, category, images, sizes } = body

        if (!name || !description || !mrp || !price || !category || !images || images.length === 0) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                mrp: parseFloat(mrp),
                price: parseFloat(price),
                images: JSON.stringify(Array.isArray(images) ? images : []),
                sizes: JSON.stringify(Array.isArray(sizes) ? sizes : []),
                category,
                storeId: store.id
            },
            include: {
                store: true,
                rating: true
            }
        })

        // Parse the JSON strings for response
        return NextResponse.json({
            ...product,
            images: JSON.parse(product.images),
            sizes: JSON.parse(product.sizes)
        }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}