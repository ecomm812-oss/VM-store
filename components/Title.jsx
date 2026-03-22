'use client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Title = ({ title, description, visibleButton = true, href = '' }) => {

    return (
        <div className='flex flex-col items-center animate-fadeInUp'>
            <h2 className='text-2xl font-semibold text-slate-800 transition-all duration-300'>{title}</h2>
            <Link href={href} className='flex items-center gap-5 text-sm text-slate-600 mt-2 transition-all duration-300 hover:text-slate-800 group'>
                <p className='max-w-lg text-center'>{description}</p>
                {visibleButton && (
                    <button className='text-green-500 flex items-center gap-1 transition-all duration-300 group-hover:gap-2 group-hover:translate-x-1'>
                        View more <ArrowRight size={14} className='transition-transform duration-300 group-hover:rotate-45' />
                    </button>
                )}
            </Link>
        </div>
    )
}

export default Title