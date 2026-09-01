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

    const badgeText = rating >= 4 ? 'Popular' : 'New'

    return (
        <Link href={`/product/${product.id}`} className='group block w-full max-w-[280px] mx-auto animate-fadeInUp stagger-item'>
            <div className='relative w-full rounded-[26px] border border-slate-200 bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_45px_rgba(79,70,229,0.12)] card-animate'>
                <div className='relative overflow-hidden rounded-[20px] bg-slate-100 aspect-square'>
                    <div className='absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-sm backdrop-blur-sm'>
                        {badgeText}
                    </div>
                    <Image fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px" className='object-cover transition duration-500 group-hover:scale-110' src={imageSrc} alt={product.name || 'Product image'} />
                </div>
                <div className='flex justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-slate-800 pt-3 w-full transition-all duration-300'>
                    <div className='transition-all duration-300 group-hover:text-slate-900 flex-1 min-w-0'>
                        <p className='font-semibold truncate text-slate-800'>{product.name}</p>
                        <div className='flex items-center gap-1 mt-1'>
                            {Array(5).fill('').map((_, index) => (
                                <StarIcon key={index} size={12} className='transition-transform duration-300 group-hover:scale-110 flex-shrink-0' fill={rating >= index + 1 ? '#FBBF24' : '#E2E8F0'} stroke={rating >= index + 1 ? '#F59E0B' : '#CBD5E1'} />
                            ))}
                            <span className='ml-1 text-[10px] font-medium text-slate-500'>{ratingCount}</span>
                        </div>
                    </div>
                    <div className='flex flex-col items-end flex-shrink-0'>
                        <p className='font-black text-slate-900'>{currency}{product.price}</p>
                        <span className='mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700'>In stock</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default memo(ProductCard)