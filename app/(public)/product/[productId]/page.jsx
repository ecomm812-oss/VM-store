import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { prisma } from "@/lib/prisma";
import { getDevProductById, shouldAllowDevProductFileFallback } from "@/lib/dev-product-fallback";
import { normalizeProductResponse } from "@/lib/product-utils";

async function loadProduct(productId) {
    if (!productId) return null

    console.log('[Product Page] Loading product:', productId)

    // Always try database first (even in development) to maintain consistency with home page
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

    // Try dummy data as fallback
    try {
        const { productDummyData } = await import('@/assets/assets')
        const dummyProduct = productDummyData.find(p => p.id === productId)
        if (dummyProduct) {
            console.log('[Product Page] Found product in dummy data:', dummyProduct.name)
            return normalizeProductResponse(dummyProduct)
        }
    } catch (dummyError) {
        console.error('[Product Page] Error loading dummy data:', dummyError?.message)
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

    console.log('[Product Page] Product not found anywhere:', productId)
    return null
}

export default async function Product({ params }) {
    const productId = params.productId
    console.log('[Product Page] Loading product with ID:', productId)

    const product = await loadProduct(productId)

    if (!product) {
        console.error('[Product Page] No product found for ID:', productId)
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

    console.log('[Product Page] Successfully loaded product:', product.name, 'with ID:', product.id)

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
