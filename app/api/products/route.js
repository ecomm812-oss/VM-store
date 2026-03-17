import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

        return NextResponse.json(products)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}