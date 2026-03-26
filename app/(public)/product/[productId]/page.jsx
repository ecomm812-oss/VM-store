'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState();
    const products = useSelector(state => state.product.list);

    const fetchProduct = async () => {
        const product = products.find((product) => product.id === productId);
        setProduct(product);
    }

    useEffect(() => {
        if (products.length > 0) {
            fetchProduct()
        }
        scrollTo(0, 0)
    }, [productId,products]);

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
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}
            </div>
        </div>
    );
}