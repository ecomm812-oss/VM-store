'use client'
import { assets } from '@/assets/assets'
import heroProductImg1 from '@/assets/hero_product_img1.png'
import heroProductImg2 from '@/assets/hero_product_img2.png'
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react'
import React from 'react'
import Link from 'next/link'
import CategoriesMarquee from './CategoriesMarquee'

const Hero = () => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    return (
        <div className='mx-3 sm:mx-4 lg:mx-6 overflow-x-hidden'>
            <div className='flex max-xl:flex-col gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto my-6 sm:my-10'>
                <div className='relative flex-1 flex flex-col bg-green-300 rounded-2xl sm:rounded-3xl xl:min-h-100 group animate-fadeInUp overflow-hidden'>
                    <div className='p-4 sm:p-8 lg:p-16'>
                        <div className='inline-flex items-center gap-2 sm:gap-3 bg-green-300 text-green-600 pr-3 sm:pr-4 p-1 rounded-full text-xs transition-all duration-300 hover:bg-green-400'>
                            <span className='bg-green-600 px-2 sm:px-3 py-1 rounded-full text-white text-xs'>NEWS</span> New arrivals live. <ChevronRightIcon className='group-hover:ml-2 transition-all' size={14} />
                        </div>
                        <h2 className='text-2xl sm:text-3xl lg:text-5xl leading-[1.2] my-2 sm:my-3 font-medium bg-gradient-to-r from-slate-600 to-[#4ff800] bg-clip-text text-transparent max-w-xs lg:max-w-md animate-slideInUp' style={{ animationDelay: '0.1s' }}>
                            Gadgets you'll love. Prices you'll trust.
                        </h2>
                        <div className='text-slate-800 text-xs sm:text-sm font-medium mt-3 sm:mt-8 animate-slideInUp' style={{ animationDelay: '0.2s' }}>
                            <p>Starts from</p>
                            <p className='text-2xl sm:text-3xl'>{currency}500</p>
                        </div>
                        <Link href="/shop">
                            <button className='bg-slate-800 text-white text-xs sm:text-sm py-2 px-5 sm:py-3 lg:py-5 lg:px-12 mt-3 sm:mt-10 rounded-md hover:bg-slate-900 hover:scale-103 active:scale-95 transition btn-primary animate-slideInUp whitespace-nowrap' style={{ animationDelay: '0.3s' }}>SHOP NOW</button>
                        </Link>
                    </div>
                    <img priority="true" className='w-full sm:max-w-sm lg:max-w-md animate-fadeInRight absolute bottom-0 right-0 object-contain' style={{ animationDelay: '0.2s' }} src={assets.hero_model_img} alt="Hero Model" />
                </div>
                <div className='flex flex-col md:flex-row xl:flex-col gap-3 sm:gap-5 w-full xl:max-w-sm text-xs sm:text-sm text-slate-600'>
                    <div className='flex-1 flex flex-col sm:flex-row items-center justify-between w-full bg-orange-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 group hover-lift card-animate animate-fadeInRight' style={{ animationDelay: '0.1s' }}>
                        <div>
                            <p className='text-xl sm:text-2xl lg:text-3xl font-medium bg-gradient-to-r from-slate-800 to-[#FFAD51] bg-clip-text text-transparent max-w-40'>Best products</p>
                            <Link href="/shop">
                                <p className='flex items-center gap-1 mt-2 sm:mt-4 transition-all duration-300 group-hover:gap-2 cursor-pointer text-xs sm:text-sm'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={16} /> </p>
                            </Link>
                        </div>
                        <img className='w-24 sm:w-32 lg:w-36 transition-transform duration-300 group-hover:scale-110 flex-shrink-0 mt-2 sm:mt-0' src={heroProductImg1.src || heroProductImg1} alt="Best products" />
                    </div>
                    <div className='flex-1 flex flex-col sm:flex-row items-center justify-between w-full bg-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 group hover-lift card-animate animate-fadeInRight' style={{ animationDelay: '0.2s' }}>
                        <div>
                            <p className='text-xl sm:text-2xl lg:text-3xl font-medium bg-gradient-to-r from-slate-800 to-[#78B2FF] bg-clip-text text-transparent max-w-40'>20% discounts</p>
                            <Link href="/shop">
                                <p className='flex items-center gap-1 mt-2 sm:mt-4 transition-all duration-300 group-hover:gap-2 cursor-pointer text-xs sm:text-sm'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={16} /> </p>
                            </Link>
                        </div>
                        <img className='w-24 sm:w-32 lg:w-36 transition-transform duration-300 group-hover:scale-110 flex-shrink-0 mt-2 sm:mt-0' src={heroProductImg2.src || heroProductImg2} alt="Discounts" />
                    </div>
                </div>
            </div>
            <CategoriesMarquee />
        </div>

    )
}

export default Hero