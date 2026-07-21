'use client'
import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { normalizeStringArrayInput, sanitizeImageSrc } from '@/lib/product-utils'

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    const getImageSrc = (value) => {
        if (Array.isArray(value)) {
            for (const item of value) {
                const src = getImageSrc(item)
                if (src) return src
            }
            return null
        }

        if (value && typeof value === 'object') {
            const src = sanitizeImageSrc(value)
            if (src) return src

            for (const item of Object.values(value)) {
                const nestedSrc = getImageSrc(item)
                if (nestedSrc) return nestedSrc
            }
            return null
        }

        if (typeof value === 'string') {
            const parsedValues = normalizeStringArrayInput(value)
            for (const item of parsedValues) {
                const src = sanitizeImageSrc(item)
                if (src) return src
            }
            return sanitizeImageSrc(value)
        }

        return null
    }

    const imageSrc = getImageSrc(product?.images) || '/placeholder.png'

    // Validate product data
    if (!product || !product.id || !product.name) {
        return null
    }

    const ratingCount = typeof product.ratingCount === 'number'
        ? product.ratingCount
        : (Array.isArray(product.rating) ? product.rating.length : 0)

    // calculate average rating from precomputed value when available.
    const rating = typeof product.averageRating === 'number'
        ? Math.round(product.averageRating)
        : (Array.isArray(product.rating) && product.rating.length > 0
            ? Math.round(product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length)
            : 0)

    return (
        <Link href={`/product/${product.id}`} className='group max-xl:mx-auto animate-fadeInUp stagger-item'>
            <div className='relative bg-[#F5F5F5] h-40 w-full sm:w-60 sm:h-68 rounded-lg overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:bg-white card-animate'>
                <Image fill sizes="(max-width: 640px) 150px, 300px" className='object-cover group-hover:scale-115 transition duration-300' src={imageSrc} alt={product.name || 'Product image'} />
            </div>
            <div className='flex justify-between gap-3 text-sm text-slate-800 pt-2 max-w-60 transition-all duration-300'>
                <div className='transition-all duration-300 group-hover:text-slate-900'>
                    <p className='font-medium'>{product.name}</p>
                    <div className='flex gap-0.5'>
                        {Array(5).fill('').map((_, index) => (
                            <StarIcon key={index} size={14} className='text-transparent transition-transform duration-300 group-hover:scale-110' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                        ))}
                    </div>
                    <p className='text-xs text-slate-500 mt-1'>{ratingCount} reviews</p>
                </div>
                <p className='font-semibold transition-colors duration-300 group-hover:text-green-600'>{currency}{product.price}</p>
            </div>
        </Link>
    )
}

export default ProductCard