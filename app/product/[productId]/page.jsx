import ProductDescription from '@/components/ProductDescription'
import ProductDetails from '@/components/ProductDetails'
import StructuredData from '@/components/StructuredData'
import { prisma } from '@/lib/prisma'
import { normalizeProductResponse } from '@/lib/product-utils'
import { getDevProductById, shouldUseDevProductFallback } from '@/lib/dev-product-fallback'

export const revalidate = 60

export async function generateMetadata({ params }) {
    const { productId } = await params
    const product = await loadProduct(productId)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vmcart.in'

    if (!product) {
        return {
            title: 'Product Not Found | VM Cart',
            description: 'This product is unavailable right now. Explore similar products on VM Cart.',
            alternates: { canonical: `${siteUrl}/product/${productId}` },
        }
    }

    return {
        title: `${product.name} | Buy Online on VM Cart`,
        description: `Buy ${product.name} online on VM Cart. Shop from local sellers with great offers and reliable delivery.`,
        alternates: { canonical: `${siteUrl}/product/${productId}` },
        openGraph: {
            title: `${product.name} | Buy Online on VM Cart`,
            description: `Buy ${product.name} online on VM Cart. Shop from local sellers with great offers and reliable delivery.`,
            images: product.images?.[0] ? [product.images[0]] : [],
        },
    }
}

function createFallbackProduct(productId) {
    return {
        id: productId,
        name: 'Product preview',
        description: 'This product is currently unavailable, but you can still browse the store and discover similar items.',
        mrp: 0,
        price: 0,
        images: ['/placeholder.png'],
        sizes: [],
        category: 'General',
        inStock: false,
        storeId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rating: [],
        store: null,
        deliveryCharge: 0
    }
}

function isProductColumnTypeMismatch(error) {
    const message = error?.message || ''
    return message.includes("Expected a string in column 'images'") ||
        message.includes("Expected a string in column 'sizes'") ||
        message.includes('malformed array literal') ||
        message.includes('Expected a string in column')
}

async function loadProductFromRaw(productId) {
    const [product] = await prisma.$queryRaw`
        SELECT
            p.id,
            p.name,
            p.description,
            p.mrp,
            p.price,
            p.images,
            p.sizes,
            p.category,
            p."inStock",
            p."storeId"
        FROM "Product" p
        WHERE p.id = ${productId}
    `

    if (!product) return null

    return normalizeProductResponse({
        ...product,
        images: product.images,
        sizes: product.sizes,
        store: product.storeId ? await prisma.store.findUnique({ where: { id: product.storeId } }) : null
    })
}

async function loadProduct(productId) {
    if (!productId) return null

    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                name: true,
                description: true,
                mrp: true,
                price: true,
                deliveryCharge: true,
                images: true,
                sizes: true,
                category: true,
                inStock: true,
                storeId: true,
                createdAt: true,
                updatedAt: true,
                store: {
                    select: {
                        id: true,
                        name: true,
                        logo: true,
                        username: true
                    }
                },
                rating: {
                    take: 5,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        user: {
                            select: {
                                name: true,
                                image: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        rating: true
                    }
                }
            }
        })

        if (product) {
            const ratingStats = await prisma.rating.aggregate({
                where: { productId },
                _avg: {
                    rating: true
                },
                _count: {
                    _all: true
                }
            })

            return normalizeProductResponse({
                ...product,
                ratingAvg: Number(ratingStats._avg.rating || 0),
                _count: {
                    rating: ratingStats._count._all
                }
            })
        }
    } catch (error) {
        if (isProductColumnTypeMismatch(error)) {
            const fallbackProduct = await loadProductFromRaw(productId)
            if (fallbackProduct) return fallbackProduct
        }

        if (shouldUseDevProductFallback(error)) {
            const devProduct = await getDevProductById(productId)
            if (devProduct) return devProduct
        }
    }

    const devProduct = await getDevProductById(productId)
    return devProduct || null
}

export default async function Product({ params }) {
    const { productId } = await params
    const product = await loadProduct(productId)

    if (!product) {
        const fallbackProduct = createFallbackProduct(productId)
        return (
            <div className="mx-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-gray-600 text-sm mt-8 mb-5">Home / Products / General</div>
                    <ProductDetails product={fallbackProduct} />
                    <ProductDescription product={fallbackProduct} />
                </div>
            </div>
        )
    }

    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.images || [],
        offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: product.price,
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vmcart.in'}/product/${product.id}`,
        },
    }

    return (
        <div className="mx-6">
            <StructuredData data={productSchema} />
            <div className="max-w-7xl mx-auto">
                <div className="text-gray-600 text-sm mt-8 mb-5">Home / Products / {product.category}</div>
                <ProductDetails product={product} />
                <ProductDescription product={product} />
            </div>
        </div>
    )
}
