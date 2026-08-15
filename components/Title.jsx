"use client"
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

const Title = ({ title, description, visibleButton = true, href = '' }) => {
    const router = useRouter()

    const handlePrefetch = () => {
        if (href) router.prefetch(href)
    }

    return (
        <div className='flex flex-col items-center animate-fadeInUp px-3 sm:px-6 overflow-x-hidden'>
            <h2 className='text-xl sm:text-2xl font-semibold text-slate-800 transition-all duration-300 text-center'>{title}</h2>
            <Link href={href} onMouseEnter={handlePrefetch} onFocus={handlePrefetch} className='flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-xs sm:text-sm text-slate-600 mt-2 transition-all duration-300 hover:text-slate-800 group'>
                <p className='max-w-xs sm:max-w-lg text-center'>{description}</p>
                {visibleButton && (
                    <button className='text-green-500 flex items-center gap-1 transition-all duration-300 group-hover:gap-2 group-hover:translate-x-1 whitespace-nowrap'>
                        View more <ArrowRight size={12} className='transition-transform duration-300 group-hover:rotate-45' />
                    </button>
                )}
            </Link>
        </div>
    )
}

export default Title