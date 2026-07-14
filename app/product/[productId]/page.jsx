import ProductDescription from '@/components/ProductDescription'
import ProductDetails from '@/components/ProductDetails'
import { prisma } from '@/lib/prisma'
import { normalizeProductResponse } from '@/lib/product-utils'
import { getDevProductById, shouldUseDevProductFallback } from '@/lib/dev-product-fallback'

export const revalidate = 60

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

        if (product) {
            return normalizeProductResponse(product)
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
        return (
            <div className="mx-6">
                <div className="max-w-7xl mx-auto text-center py-24">
                    <p className="text-red-500 text-xl font-semibold">Unable to load product details.</p>
                    <p className="text-slate-500 mt-4">The product you are looking for may not exist or is currently unavailable.</p>
                    <a href="/shop" className="text-blue-500 hover:text-blue-700 mt-6 inline-block">
                        Back to shop
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-gray-600 text-sm mt-8 mb-5">Home / Products / {product.category}</div>
                <ProductDetails product={product} />
                <ProductDescription product={product} />
            </div>
        </div>
    )
}
