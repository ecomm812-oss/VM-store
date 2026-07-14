import ProductDescription from '@/components/ProductDescription'
import ProductDetails from '@/components/ProductDetails'
import { prisma } from '@/lib/prisma'
import { normalizeProductResponse } from '@/lib/product-utils'
import { getDevProductById, shouldUseDevProductFallback } from '@/lib/dev-product-fallback'

export const revalidate = 60

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
