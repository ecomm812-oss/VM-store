import { prisma } from '@/lib/prisma'
import { normalizeProductResponse, toImageSrc } from '@/lib/product-utils'
import { getPublicDevProducts, getDevProductsByStoreId, shouldUseDevProductFallback } from '@/lib/dev-product-fallback'
import { getDevStoreByUsername } from '@/lib/dev-store-fallback'

const PUBLIC_PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  mrp: true,
  price: true,
  images: true,
  sizes: true,
  category: true,
  createdAt: true,
  inStock: true,
  store: true,
  _count: {
    select: {
      rating: true
    }
  }
}

function buildProductWhere(search, category) {
  const where = { inStock: true }

  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive'
    }
  }

  if (category) {
    where.category = {
      equals: category,
      mode: 'insensitive'
    }
  }

  return where
}

function normalizeProductList(products) {
  return products
    .map(normalizeProductResponse)
    .filter(product => product && product.id && product.images.length > 0)
}

async function getDevProducts({ search, category } = {}) {
  const products = await getPublicDevProducts({
    search: search || '',
    category: category || ''
  })
  return normalizeProductList(products)
}

export async function getLatestProducts({ take = 4 } = {}) {
  try {
    const products = await prisma.product.findMany({
      where: { inStock: true },
      orderBy: { createdAt: 'desc' },
      take,
      select: PUBLIC_PRODUCT_SELECT
    })

    return normalizeProductList(products)
  } catch (error) {
    console.error('getLatestProducts error:', error?.message || error)
    // Fall back to dev products on any error (connection, timeout, etc.)
    const products = await getDevProducts()
    return products.slice(0, take)
  }
}

export async function getBestSellingProducts({ take = 8 } = {}) {
  try {
    // Let the database sort by rating count first, then by createdAt.
    const products = await prisma.product.findMany({
      where: { inStock: true },
      orderBy: [
        { _count: { rating: 'desc' } },
        { createdAt: 'desc' }
      ],
      take,
      select: PUBLIC_PRODUCT_SELECT
    })

    return normalizeProductList(products).map(product => ({
      ...product,
      ratingCount: product?._count?.rating ?? 0
    }))
  } catch (error) {
    if (shouldUseDevProductFallback(error)) {
      return (await getDevProducts())
        .map(product => ({
          ...product,
          ratingCount: product.rating?.length || 0
        }))
        .sort((a, b) => {
          const ratingA = a.ratingCount || 0
          const ratingB = b.ratingCount || 0
          if (ratingA !== ratingB) return ratingB - ratingA
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        .slice(0, take)
    }

    throw error
  }
}

export async function countPublicShopProducts({ search, category } = {}) {
  try {
    return await prisma.product.count({ where: buildProductWhere(search, category) })
  } catch (error) {
    if (shouldUseDevProductFallback(error)) {
      const products = await getDevProducts({ search, category })
      return products.length
    }

    throw error
  }
}

export async function getPublicShopProducts({ search, category, take = 24, skip = 0 } = {}) {
  try {
    const products = await prisma.product.findMany({
      where: buildProductWhere(search, category),
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      select: PUBLIC_PRODUCT_SELECT
    })

    return normalizeProductList(products)
  } catch (error) {
    console.error('getPublicShopProducts error:', error?.message || error)
    return getDevProducts({ search, category })
  }
}

export async function getStoreWithProducts(username) {
  try {
    const store = await prisma.store.findUnique({
      where: { username },
      select: {
        id: true,
        storeName: true,
        description: true,
        logo: true,
        address: true,
        email: true,
        user: {
          select: {
            name: true,
            image: true
          }
        },
        products: {
          where: { inStock: true },
          orderBy: { createdAt: 'desc' },
          select: PUBLIC_PRODUCT_SELECT
        }
      }
    })

    if (!store) return null

    return {
      ...store,
      logo: toImageSrc(store.logo),
      products: normalizeProductList(store.products)
    }
  } catch (error) {
    if (shouldUseDevProductFallback(error)) {
      const store = await getDevStoreByUsername(username)
      if (!store) return null

      const products = await getDevProductsByStoreId(store.id)
      return {
        ...store,
        logo: toImageSrc(store.logo),
        products: normalizeProductList(products)
      }
    }

    throw error
  }
}
