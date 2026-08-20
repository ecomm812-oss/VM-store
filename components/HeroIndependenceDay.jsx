'use client'
import { assets } from '@/assets/assets'
import heroProductImg1 from '@/assets/hero_product_img1.png'
import heroProductImg2 from '@/assets/hero_product_img2.png'
import { ArrowRightIcon, ChevronRightIcon, Sparkles } from 'lucide-react'
import React from 'react'
import Link from 'next/link'
import CategoriesMarquee from './CategoriesMarquee'

const HeroIndependenceDay = () => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    return (
        <div className='mx-3 sm:mx-4 lg:mx-6 overflow-x-hidden'>
            {/* Raksha Bandhan Banner */}
            <div className='relative max-w-7xl mx-auto mb-4 sm:mb-6 overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg animate-fadeInUp'>
                <div className='flex h-24 sm:h-32 md:h-40'>
                    <div className='flex-1 bg-[#7a0b2d] relative overflow-hidden'>
                        <div className='absolute inset-0 opacity-20'>
                            <div className='absolute top-1 left-2 text-2xl sm:text-3xl lg:text-4xl animate-bounce' style={{ animationDelay: '0s' }}>🎀</div>
                            <div className='absolute bottom-1 right-3 text-xl sm:text-2xl lg:text-3xl animate-bounce' style={{ animationDelay: '0.2s' }}>💐</div>
                        </div>
                    </div>
                    <div className='flex-1 bg-[#fff3f6] relative overflow-hidden flex items-center justify-center'>
                        <div className='text-center px-2'>
                            <Sparkles className='inline-block text-[#b81d5d] animate-spin' size={18} style={{ animationDuration: '3s' }} />
                            <p className='font-bold text-sm sm:text-lg md:text-2xl text-slate-800 mt-1'>Raksha Bandhan</p>
                            <Sparkles className='inline-block text-[#d4a124] animate-spin ml-1' size={18} style={{ animationDuration: '3s' }} />
                        </div>
                    </div>
                    <div className='flex-1 bg-[#f4b942] relative overflow-hidden'>
                        <div className='absolute inset-0 opacity-20'>
                            <div className='absolute top-1 right-2 text-2xl sm:text-3xl lg:text-4xl animate-bounce' style={{ animationDelay: '0.1s' }}>🎀</div>
                            <div className='absolute bottom-1 left-3 text-xl sm:text-2xl lg:text-3xl animate-bounce' style={{ animationDelay: '0.3s' }}>💝</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex max-xl:flex-col gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto my-6 sm:my-10'>
                <div className='relative flex-1 flex flex-col rounded-2xl sm:rounded-3xl xl:min-h-100 group animate-fadeInUp overflow-hidden bg-gradient-to-br from-[#fce7f3] via-white to-[#fff7d6]'>
                    
                    <div className='relative p-4 sm:p-8 lg:p-16 z-10'>
                        <div className='inline-flex items-center gap-2 sm:gap-3 bg-[#f9dfe8] text-[#7a0b2d] pr-3 sm:pr-4 p-1 rounded-full text-xs transition-all duration-300 hover:bg-[#f5cfe0] flex-wrap'>
                            <span className='bg-[#7a0b2d] px-2 sm:px-3 py-1 rounded-full text-white text-xs font-bold'>SPECIAL</span>
                            <span className='animate-pulse text-xs'>Raksha Bandhan Sale</span>
                            <ChevronRightIcon className='group-hover:ml-2 transition-all hidden sm:inline' size={14} />
                        </div>

                        <h2 className='text-xl sm:text-3xl lg:text-5xl leading-[1.2] my-2 sm:my-3 font-bold bg-gradient-to-r from-[#7a0b2d] via-[#b81d5d] to-[#d4a124] bg-clip-text text-transparent max-w-xs lg:max-w-md animate-slideInUp' style={{ animationDelay: '0.1s' }}>
                            Celebrate the bond with special festive deals
                        </h2>

                        <p className='text-slate-700 text-xs sm:text-base lg:text-lg font-medium mt-2 sm:mt-3 animate-slideInUp' style={{ animationDelay: '0.15s' }}>
                            ✨ Thoughtful gifts, sweets, and essentials for your sibling.
                        </p>

                        <div className='text-slate-800 text-xs sm:text-sm font-medium mt-3 sm:mt-8 animate-slideInUp' style={{ animationDelay: '0.2s' }}>
                            <p>Starting from</p>
                            <div className='flex items-center gap-2 flex-wrap'>
                                <p className='text-2xl sm:text-3xl font-bold text-[#7a0b2d]'>{currency}399</p>
                                <span className='text-xs line-through text-slate-500'>{currency}799</span>
                                <span className='bg-[#c91d4a] text-white text-xs font-bold px-2 py-0.5 sm:py-1 rounded'>50% OFF</span>
                            </div>
                        </div>

                        <Link href="/shop">
                            <button className='bg-gradient-to-r from-[#7a0b2d] to-[#d4a124] text-white text-xs sm:text-sm py-2 px-5 sm:py-3 lg:py-5 lg:px-12 mt-3 sm:mt-10 rounded-md hover:from-[#5e0823] hover:to-[#c9981f] hover:scale-103 active:scale-95 transition btn-primary animate-slideInUp shadow-lg whitespace-nowrap' style={{ animationDelay: '0.3s' }}>
                                SHOP NOW 🎁
                            </button>
                        </Link>
                    </div>

                    <img priority="true" className='w-40 sm:w-72 lg:w-96 animate-fadeInRight absolute -bottom-8 -right-4 sm:bottom-0 sm:right-0 object-contain pointer-events-none' style={{ animationDelay: '0.2s', maxHeight: '100%' }} src={assets.hero_model_img} alt="Raksha Bandhan Celebration" />
                </div>

                <div className='flex flex-col md:flex-row xl:flex-col gap-3 sm:gap-5 w-full xl:max-w-sm text-xs sm:text-sm text-slate-600'>
                    <div className='flex-1 flex flex-col sm:flex-row items-center justify-between w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 group hover-lift card-animate animate-fadeInRight overflow-hidden relative' style={{ animationDelay: '0.1s', background: 'linear-gradient(135deg, #7a0b2d 0%, #d94b81 100%)' }}>
                        <div className='relative z-10'>
                            <p className='text-lg sm:text-2xl lg:text-3xl font-bold text-white max-w-40'>Gift Collection</p>
                            <Link href="/shop">
                                <p className='flex items-center gap-1 mt-2 sm:mt-4 transition-all duration-300 group-hover:gap-2 cursor-pointer text-white hover:underline text-xs sm:text-sm'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={14} /> </p>
                            </Link>
                        </div>
                        <div className='absolute inset-0 opacity-10 flex items-center justify-center text-3xl sm:text-5xl'>🎀</div>
                        <img className='w-20 sm:w-28 lg:w-36 transition-transform duration-300 group-hover:scale-110 relative z-20 flex-shrink-0 mt-2 sm:mt-0' src={heroProductImg1.src || heroProductImg1} alt="Gift Collection" />
                    </div>

                    <div className='flex-1 flex flex-col sm:flex-row items-center justify-between w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 group hover-lift card-animate animate-fadeInRight overflow-hidden relative' style={{ animationDelay: '0.2s', background: 'linear-gradient(135deg, #c91d4a 0%, #f4b942 100%)' }}>
                        <div className='relative z-10'>
                            <p className='text-lg sm:text-2xl lg:text-3xl font-bold text-white max-w-40'>Festival Savings</p>
                            <p className='text-white text-xs sm:text-sm mt-1 sm:mt-2'>Up to 70% off</p>
                            <Link href="/shop">
                                <p className='flex items-center gap-1 mt-2 sm:mt-4 transition-all duration-300 group-hover:gap-2 cursor-pointer text-white hover:underline text-xs sm:text-sm'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={14} /> </p>
                            </Link>
                        </div>
                        <div className='absolute inset-0 opacity-10 flex items-center justify-center text-3xl sm:text-5xl'>💝</div>
                        <img className='w-20 sm:w-28 lg:w-36 transition-transform duration-300 group-hover:scale-110 relative z-20 flex-shrink-0 mt-2 sm:mt-0' src={heroProductImg2.src || heroProductImg2} alt="Festival Savings" />
                    </div>
                </div>
            </div>

            <div className='max-w-7xl mx-auto my-8 sm:my-12 bg-gradient-to-r from-[#fce7f3] via-white to-[#fff5c7] rounded-2xl p-4 sm:p-8 border-2 border-[#e6a7be] animate-fadeInUp'>
                <p className='text-center text-sm sm:text-lg md:text-xl font-semibold text-slate-800 max-w-3xl mx-auto px-2'>
                    "Celebrate the love, laughter, and protection of Raksha Bandhan with special festive offers."
                </p>
                <p className='text-center text-xs sm:text-sm text-slate-600 mt-3 sm:mt-4'>Offer valid till August 09, 2026</p>
            </div>

            <CategoriesMarquee />
        </div>

    )
}

export default HeroIndependenceDay
