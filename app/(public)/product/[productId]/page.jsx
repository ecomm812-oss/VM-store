'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState();
    const [loading, setLoading] = useState(true);

    const fetchProduct = async () => {
        try {
            console.log('[Product Page] Fetching product with ID:', productId)
            const response = await fetch(`/api/products?productId=${productId}`)
            
            console.log('[Product Page] API response status:', response.status)
            
            const data = await response.json()
            console.log('[Product Page] API response data:', data)

            if (!response.ok) {
                console.error(`[Product Page] API returned error status ${response.status}:`, data)
                setProduct(null)
                return
            }

            // Check if response is an error object
            if (data?.error) {
                console.error('[Product Page] API returned error:', data.error)
                setProduct(null)
                return
            }

            // Validate product data has required fields
            if (!data || typeof data !== 'object' || !data.id || !data.name) {
                console.error('[Product Page] Invalid product data - missing required fields:', data)
                setProduct(null)
                return
            }

            // Ensure images is an array
            if (!Array.isArray(data.images)) {
                console.warn('[Product Page] Product images is not an array, converting...')
                data.images = data.images ? [data.images] : []
            }

            // Ensure rating is an array
            if (!Array.isArray(data.rating)) {
                console.warn('[Product Page] Product rating is not an array, defaulting to empty')
                data.rating = []
            }

            console.log('[Product Page] Product loaded successfully:', data.name)
            setProduct(data)
        } catch (error) {
            console.error('[Product Page] Fetch error:', error?.message || error)
            console.error('[Product Page] Full error:', error)
            setProduct(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setLoading(true)
        fetchProduct()
        scrollTo(0, 0)
    }, [productId]);

    // Generate dynamic metadata
    const generateMetadata = (product) => {
        if (!product) return {};

        return {
            title: `${product.name} | Buy Online on VM Cart`,
            description: `Buy ${product.name} at great prices on VM Cart. ${product.description?.substring(0, 100)}... Shop from independent sellers with fast shipping and easy returns.`,
            openGraph: {
                title: `${product.name} | VM Cart`,
                description: `Buy ${product.name} at great prices. ${product.description?.substring(0, 100)}...`,
                images: product.images?.[0] ? [{ url: product.images[0], alt: product.name }] : [],
            },
        };
    };

    const metadata = generateMetadata(product);

    return (
        <div className="mx-6">
            {/* Dynamic meta tags for SEO */}
            {metadata.title && (
                <>
                    <title>{metadata.title}</title>
                    <meta name="description" content={metadata.description} />
                    <meta property="og:title" content={metadata.openGraph?.title} />
                    <meta property="og:description" content={metadata.openGraph?.description} />
                    {metadata.openGraph?.images?.[0] && (
                        <meta property="og:image" content={metadata.openGraph.images[0].url} />
                    )}
                </>
            )}

            <div className="max-w-7xl mx-auto">

                {/* Breadcrums */}
                <div className="  text-gray-600 text-sm mt-8 mb-5">
                    Home / Products / {product?.category}
                </div>

                {/* Product Details */}
                {loading && <p className="text-slate-500">Loading product...</p>}
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}
                {!loading && !product && (
                    <div className="text-center py-8">
                        <p className="text-red-500 mb-4">Unable to load product details.</p>
                        <p className="text-gray-500 text-sm">The product you're looking for may not exist or is currently unavailable.</p>
                        <a href="/shop" className="text-blue-500 hover:text-blue-700 mt-4 inline-block">
                            Back to shop
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}