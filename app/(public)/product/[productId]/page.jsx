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
            const response = await fetch(`/api/products?productId=${productId}`)
            if (!response.ok) {
                setProduct(null)
                return
            }

            const data = await response.json()
            setProduct(data)
        } catch {
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
                {!loading && !product && <p className="text-red-500">Unable to load product details.</p>}
            </div>
        </div>
    );
}