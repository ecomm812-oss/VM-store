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
        <div className='flex w-full flex-col items-center animate-fadeInUp px-0 sm:px-3 overflow-x-hidden'>
            <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-700'>
                <span className='inline-block h-2 w-2 rounded-full bg-violet-600'></span>
                Curated picks
            </div>
            <h2 className='text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 transition-all duration-300 text-center tracking-tight'>{title}</h2>
            <Link href={href} onMouseEnter={handlePrefetch} onFocus={handlePrefetch} className='flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5 text-xs sm:text-sm text-slate-600 mt-3 transition-all duration-300 hover:text-slate-800 group'>
                <p className='max-w-xs sm:max-w-lg text-center text-slate-600'>{description}</p>
                {visibleButton && (
                    <button className='inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm transition-all duration-300 group-hover:gap-2 group-hover:border-violet-200 group-hover:text-violet-700 whitespace-nowrap'>
                        View more <ArrowRight size={12} className='transition-transform duration-300 group-hover:rotate-45' />
                    </button>
                )}
            </Link>
        </div>
    )
}

export default Title