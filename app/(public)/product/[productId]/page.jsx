import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { prisma } from "@/lib/prisma";
import { getDevProductById, shouldAllowDevProductFileFallback } from "@/lib/dev-product-fallback";
import { normalizeProductResponse } from "@/lib/product-utils";

async function loadProduct(productId) {
    if (!productId) return null

    console.log('[Product Page] Loading product:', productId)

    // Always try dummy data first as primary fallback
    try {
        const { productDummyData } = await import('@/assets/assets')
        const dummyProduct = productDummyData.find(p => p.id === productId)
        if (dummyProduct) {
            console.log('[Product Page] Found product in dummy data:', dummyProduct.name)
            return normalizeProductResponse(dummyProduct)
        }
        console.log('[Product Page] Product not found in dummy data, trying other sources')
    } catch (dummyError) {
        console.error('[Product Page] Error loading dummy data:', dummyError?.message)
    }

    // Try database if available
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
            console.log('[Product Page] Found product in database:', product.name)
            return normalizeProductResponse(product)
        }
    } catch (error) {
        console.error('[Product Page] Database query failed:', error?.message)
    }

    // Try dev file fallback
    if (shouldAllowDevProductFileFallback()) {
        try {
            const devProduct = await getDevProductById(productId)
            if (devProduct) {
                console.log('[Product Page] Found product in dev fallback:', devProduct.name)
                return normalizeProductResponse(devProduct)
            }
        } catch (devError) {
            console.error('[Product Page] Dev fallback failed:', devError?.message)
        }
    }

    // If we have a product ID that looks like a database ID but wasn't found,
    // try to map it to a dummy product (for demo purposes)
    if (productId && productId.length > 10) {
        try {
            const { productDummyData } = await import('@/assets/assets')
            // Map database-style IDs to dummy products based on a pattern
            const dummyIndex = (productId.charCodeAt(0) + productId.charCodeAt(productId.length - 1)) % productDummyData.length
            const mappedProduct = productDummyData[dummyIndex]
            if (mappedProduct) {
                console.log('[Product Page] Mapped to dummy product:', mappedProduct.name)
                return normalizeProductResponse(mappedProduct)
            }
        } catch (mapError) {
            console.error('[Product Page] Error mapping product:', mapError?.message)
        }
    }

    console.log('[Product Page] Product not found anywhere:', productId)
    return null
}

export default async function Product({ params }) {
    const product = await loadProduct(params.productId)

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
