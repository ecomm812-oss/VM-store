import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const LIST_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300'
}

export async function GET(request, { params }) {
  try {
    const username = params?.username

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const store = await prisma.store.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        description: true,
        username: true,
        email: true,
        address: true,
        logo: true,
        Product: {
          where: { inStock: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            mrp: true,
            price: true,
            images: true,
            sizes: true,
            category: true,
            createdAt: true
          }
        }
      }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const { Product: productsRaw, ...storeInfo } = store

    const products = productsRaw.map(product => ({
      ...product,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes
    }))

    return NextResponse.json({ store: storeInfo, products }, { headers: LIST_CACHE_HEADERS })
  } catch (error) {
    console.error('Store shop error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch store products' }, { status: 500 })
  }
}
