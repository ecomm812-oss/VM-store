import { prisma } from '@/lib/prisma'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vmcart.com'

function toUrl(path) {
  return `${baseUrl}${path}`
}

export default async function sitemap() {
  const staticRoutes = [
    '',
    '/about',
    '/shop',
    '/cart',
    '/contact',
    '/pricing',
    '/create-store',
    '/subscription',
    '/orders',
  ].map((route) => ({
    url: toUrl(route),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))

  let products = []
  try {
    products = await prisma.product.findMany({
      where: { inStock: true },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })
  } catch (error) {
    console.warn('Sitemap product fetch failed:', error?.message)
  }

  const productRoutes = products.map((product) => ({
    url: toUrl(`/product/${product.id}`),
    lastModified: product.updatedAt || new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...productRoutes]
}
