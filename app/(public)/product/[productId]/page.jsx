import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { prisma } from "@/lib/prisma";
import { getDevProductById, shouldAllowDevProductFileFallback } from "@/lib/dev-product-fallback";
import { normalizeProductResponse } from "@/lib/product-utils";

async function loadProduct(productId) {
    if (!productId) return null

    // In development, try dummy data first
    if (process.env.NODE_ENV !== 'production') {
        const { productDummyData } = await import('@/assets/assets')
        const dummyProduct = productDummyData.find(p => p.id === productId)
        if (dummyProduct) {
            return normalizeProductResponse(dummyProduct)
        }
    }

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
        console.error('[Product Page] Database query failed:', error?.message)
        // Try API fallback
        try {
            console.log('[Product Page] Trying API fallback for product:', productId)
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products?productId=${encodeURIComponent(productId)}`, {
                cache: 'no-store'
            })
            if (response.ok) {
                const product = await response.json()
                if (product && product.id) {
                    console.log('[Product Page] Product found via API fallback:', product.name)
                    return product
                }
            }
        } catch (apiError) {
            console.error('[Product Page] API fallback failed:', apiError?.message)
        }

        if (shouldAllowDevProductFileFallback()) {
            const devProduct = await getDevProductById(productId)
            if (devProduct) {
                return normalizeProductResponse(devProduct)
            }
        }
    }

    // Additional fallback: check dummy data
    const { productDummyData } = await import('@/assets/assets')
    const dummyProduct = productDummyData.find(p => p.id === productId)
    if (dummyProduct) {
        return normalizeProductResponse(dummyProduct)
    }

    if (shouldAllowDevProductFileFallback()) {
        const devProduct = await getDevProductById(productId)
        return devProduct ? normalizeProductResponse(devProduct) : null
    }

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
