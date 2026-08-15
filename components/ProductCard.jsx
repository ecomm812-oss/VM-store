'use client'
import { memo, useMemo } from 'react'
import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
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

    const imageSrc = useMemo(() => getImageSrc(product?.images) || '/placeholder.png', [product?.images])

    // Validate product data
    if (!product || !product.id || !product.name) {
        return null
    }

    const ratingCount = useMemo(() => typeof product.ratingCount === 'number'
        ? product.ratingCount
        : (Array.isArray(product.rating) ? product.rating.length : 0), [product.ratingCount, product.rating])

    const rating = useMemo(() => typeof product.averageRating === 'number'
        ? Math.round(product.averageRating)
        : (Array.isArray(product.rating) && product.rating.length > 0
            ? Math.round(product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length)
            : 0), [product.averageRating, product.rating])

    return (
        <Link href={`/product/${product.id}`} className='group w-full sm:w-52 lg:w-60 mx-auto animate-fadeInUp stagger-item'>
            <div className='relative bg-[#F5F5F5] w-full aspect-square rounded-lg overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:bg-white card-animate'>
                <Image fill sizes="(max-width: 640px) 100%, (max-width: 1024px) 208px, 240px" className='object-cover group-hover:scale-115 transition duration-300' src={imageSrc} alt={product.name || 'Product image'} />
            </div>
            <div className='flex justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-slate-800 pt-2 w-full transition-all duration-300'>
                <div className='transition-all duration-300 group-hover:text-slate-900 flex-1 min-w-0'>
                    <p className='font-medium truncate'>{product.name}</p>
                    <div className='flex gap-0.5'>
                        {Array(5).fill('').map((_, index) => (
                            <StarIcon key={index} size={12} className='text-transparent transition-transform duration-300 group-hover:scale-110 flex-shrink-0' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                        ))}
                    </div>
                    <p className='text-xs text-slate-500 mt-1'>{ratingCount} reviews</p>
                </div>
                <p className='font-semibold transition-colors duration-300 group-hover:text-green-600 flex-shrink-0'>{currency}{product.price}</p>
            </div>
        </Link>
    )
}

export default memo(ProductCard)