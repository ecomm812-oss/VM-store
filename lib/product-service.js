import { Prisma } from '@prisma/client'
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
  storeId: true,
  store: {
    select: {
      id: true,
      name: true,
      logo: true
    }
  },
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

function getErrorMessage(error) {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (typeof error.message === 'string') return error.message
  if (typeof error.cause?.message === 'string') return error.cause.message
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function isProductColumnTypeMismatch(error) {
  const message = getErrorMessage(error).toLowerCase()

  const patterns = [
    /expected a string in column ['"]images['"], got object/, 
    /expected a string in column ['"]sizes['"], got object/, 
    /malformed array literal/,
    /invalid `prisma\.product\.findmany\(\)` invocation.*images/,
    /invalid `prisma\.product\.findmany\(\)` invocation.*sizes/
  ]

  return patterns.some(pattern => pattern.test(message))
}

function normalizeProductList(products) {
  return products
    .map(normalizeProductResponse)
    .filter(product => product && product.id)
}

async function getRawLatestProducts({ take = 4 } = {}) {
  const rawProducts = await prisma.$queryRaw`
    SELECT
      p."id",
      p."name",
      p."description",
      p."mrp",
      p."price",
      p."images",
      p."sizes",
      p."category",
      p."storeId",
      p."createdAt",
      p."inStock",
      COUNT(r."id")::int AS "ratingCount"
    FROM "Product" p
    LEFT JOIN "Rating" r ON r."productId" = p."id"
    WHERE p."inStock" = true
    GROUP BY
      p."id",
      p."name",
      p."description",
      p."mrp",
      p."price",
      p."images",
      p."sizes",
      p."category",
      p."storeId",
      p."createdAt",
      p."inStock"
    ORDER BY p."createdAt" DESC
    LIMIT ${take}
  `

  return normalizeProductList(rawProducts.map(product => ({
    ...product,
    _count: { rating: product.ratingCount ?? 0 }
  })))
}

async function getRawBestSellingProducts({ take = 8 } = {}) {
  const rawProducts = await prisma.$queryRaw`
    SELECT
      p."id",
      p."name",
      p."description",
      p."mrp",
      p."price",
      p."images",
      p."sizes",
      p."category",
      p."storeId",
      p."createdAt",
      p."inStock",
      COUNT(r."id")::int AS "ratingCount"
    FROM "Product" p
    LEFT JOIN "Rating" r ON r."productId" = p."id"
    WHERE p."inStock" = true
    GROUP BY
      p."id",
      p."name",
      p."description",
      p."mrp",
      p."price",
      p."images",
      p."sizes",
      p."category",
      p."storeId",
      p."createdAt",
      p."inStock"
    ORDER BY COUNT(r."id") DESC, p."createdAt" DESC
    LIMIT ${take}
  `

  return normalizeProductList(rawProducts.map(product => ({
    ...product,
    _count: { rating: product.ratingCount ?? 0 }
  })))
}

async function getRawPublicShopProducts({ search, category, take = 24, skip = 0 } = {}) {
  const searchTerm = search?.trim().toLowerCase() || ''
  const categoryTerm = category?.trim().toLowerCase() || ''

  const rawProducts = await prisma.$queryRaw`
    SELECT
      p."id",
      p."name",
      p."description",
      p."mrp",
      p."price",
      p."images",
      p."sizes",
      p."category",
      p."storeId",
      p."createdAt",
      p."inStock",
      COUNT(r."id")::int AS "ratingCount"
    FROM "Product" p
    LEFT JOIN "Rating" r ON r."productId" = p."id"
    WHERE p."inStock" = true
    ${searchTerm ? Prisma.sql`AND LOWER(p."name") LIKE ${`%${searchTerm}%`}` : Prisma.empty}
    ${categoryTerm ? Prisma.sql`AND LOWER(p."category") = ${categoryTerm}` : Prisma.empty}
    GROUP BY
      p."id",
      p."name",
      p."description",
      p."mrp",
      p."price",
      p."images",
      p."sizes",
      p."category",
      p."storeId",
      p."createdAt",
      p."inStock"
    ORDER BY p."createdAt" DESC
    LIMIT ${take}
    OFFSET ${skip}
  `

  return normalizeProductList(rawProducts.map(product => ({
    ...product,
    _count: { rating: product.ratingCount ?? 0 }
  })))
}

async function getRawProductsByStoreId(storeId) {
  const rawProducts = await prisma.$queryRaw`
    SELECT
      p."id",
      p."name",
      p."description",
      p."mrp",
      p."price",
      p."images",
      p."sizes",
      p."category",
      p."storeId",
      p."createdAt",
      p."inStock",
      COUNT(r."id")::int AS "ratingCount"
    FROM "Product" p
    LEFT JOIN "Rating" r ON r."productId" = p."id"
    WHERE p."storeId" = ${storeId}
      AND p."inStock" = true
    GROUP BY
      p."id",
      p."name",
      p."description",
      p."mrp",
      p."price",
      p."images",
      p."sizes",
      p."category",
      p."storeId",
      p."createdAt",
      p."inStock"
    ORDER BY p."createdAt" DESC
  `

  return normalizeProductList(rawProducts.map(product => ({
    ...product,
    _count: { rating: product.ratingCount ?? 0 }
  })))
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
    const message = getErrorMessage(error)
    console.error('getLatestProducts error:', message)
    if (isProductColumnTypeMismatch(error)) {
      console.log('getLatestProducts raw SQL fallback due to Product column type mismatch')
      return getRawLatestProducts({ take })
    }

    // Fall back to dev products on any error (connection, timeout, etc.)
    const products = await getDevProducts()
    return products.slice(0, take)
  }
}

export async function getBestSellingProducts({ take = 8 } = {}) {
  try {
    const products = await prisma.product.findMany({
      where: { inStock: true },
      orderBy: [
        { rating: { _count: 'desc' } },
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
    const message = getErrorMessage(error)
    console.error('getBestSellingProducts error:', message)

    if (isProductColumnTypeMismatch(error)) {
      console.log('getBestSellingProducts raw SQL fallback due to Product column type mismatch')
      return getRawBestSellingProducts({ take })
    }

    try {
      const rawProducts = await getRawBestSellingProducts({ take })
      if (rawProducts?.length) {
        return rawProducts
      }
    } catch (rawError) {
      console.warn('getBestSellingProducts raw SQL fallback failed:', getErrorMessage(rawError))
    }

    try {
      const devProducts = await getDevProducts()
      return devProducts
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
    } catch (fallbackError) {
      console.warn('getBestSellingProducts dev fallback failed:', getErrorMessage(fallbackError))
      return []
    }
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
    if (isProductColumnTypeMismatch(error)) {
      console.warn('getPublicShopProducts raw SQL fallback due to Product column type mismatch')
      return getRawPublicShopProducts({ search, category, take, skip })
    }

    const message = getErrorMessage(error)
    console.error('getPublicShopProducts error:', message)
    return getDevProducts({ search, category })
  }
}

export async function getPublicShopStores({ search, take = 6 } = {}) {
  const searchTerm = search?.trim() || ''

  if (!searchTerm) {
    return []
  }

  try {
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { username: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        name: true,
        username: true,
        description: true,
        logo: true,
        address: true,
        isActive: true,
        status: true
      }
    })

    return stores.map(store => ({
      ...store,
      logo: toImageSrc(store.logo)
    }))
  } catch (error) {
    console.error('getPublicShopStores error:', getErrorMessage(error))
    return []
  }
}

export async function getStoreWithProducts(username) {
  try {
    const store = await prisma.store.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        address: true,
        email: true,
        user: {
          select: {
            name: true,
            image: true
          }
        }
      }
    })

    if (!store) return null

    try {
      const products = await prisma.product.findMany({
        where: { storeId: store.id, inStock: true },
        orderBy: { createdAt: 'desc' },
        select: PUBLIC_PRODUCT_SELECT
      })

      return {
        ...store,
        storeName: store.name || null,
        logo: toImageSrc(store.logo),
        products: normalizeProductList(products)
      }
    } catch (error) {
      if (isProductColumnTypeMismatch(error)) {
        console.log('getStoreWithProducts raw SQL fallback due to Product column type mismatch')
        const products = await getRawProductsByStoreId(store.id)
        return {
          ...store,
          storeName: store.name || null,
          logo: toImageSrc(store.logo),
          products
        }
      }

      throw error
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
