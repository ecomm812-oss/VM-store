import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { prisma } from "@/lib/prisma";
import { normalizeProductResponse } from "@/lib/product-utils";
import { getDevProductById, shouldUseDevProductFallback } from "@/lib/dev-product-fallback";

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

    const parsedImages = Array.isArray(product.images) ? product.images : product.images
    const parsedSizes = Array.isArray(product.sizes) ? product.sizes : product.sizes

    let store = null
    if (product.storeId) {
        store = await prisma.store.findUnique({ where: { id: product.storeId } })
    }

    return normalizeProductResponse({
        ...product,
        images: parsedImages,
        sizes: parsedSizes,
        store
    })
}

async function loadProduct(productId) {
    if (!productId) return null

    console.log('[Product Page] Loading product:', productId)

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
        if (isProductColumnTypeMismatch(error)) {
            console.log('[Product Page] Attempting raw fallback for product:', productId)
            const fallbackProduct = await loadProductFromRaw(productId)
            if (fallbackProduct) {
                console.log('[Product Page] Loaded product via raw fallback:', fallbackProduct.name)
                return fallbackProduct
            }
        }

        if (shouldUseDevProductFallback(error)) {
            console.log('[Product Page] Database unavailable - loading product from dev fallback:', productId)
            const devProduct = await getDevProductById(productId)
            if (devProduct) {
                console.log('[Product Page] Loaded product from dev fallback:', devProduct.name)
                return devProduct
            }
        }
    }

    console.log('[Product Page] Product not found in database:', productId)
    const devProduct = await getDevProductById(productId)
    if (devProduct) {
        console.log('[Product Page] Loaded product from dev fallback after DB miss:', devProduct.name)
        return devProduct
    }

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
