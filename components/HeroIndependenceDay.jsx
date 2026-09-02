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
            <div className='relative max-w-7xl mx-auto mb-6 sm:mb-8 animate-fadeInUp'>
                <div className='rounded-[28px] border border-slate-200 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm p-3 sm:p-4'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>
                            <span className='inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500'></span>
                            Curated collections
                        </div>
                        <div className='flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-slate-600'>
                            <span className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5'>Free shipping</span>
                            <span className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5'>Easy returns</span>
                            <span className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5'>Secure checkout</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex max-xl:flex-col gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto my-6 sm:my-10'>
                <div className='relative flex-1 flex flex-col rounded-[36px] sm:rounded-[42px] xl:min-h-[620px] group animate-fadeInUp overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(134,239,172,0.45),_transparent_38%),linear-gradient(135deg,_#f0fdf4_0%,_#dcfce7_28%,_#bbf7d0_100%)] shadow-[0_30px_80px_rgba(34,197,94,0.18)]'>
                    <div className='absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.45),transparent_45%,rgba(255,255,255,0.12))]'></div>

                    <div className='relative z-10 flex flex-1 flex-col justify-center p-4 sm:p-6 lg:p-8 xl:p-10 pb-3 sm:pb-0 lg:pr-[23rem] xl:pr-[26rem]'>
                        <div className='inline-flex items-center gap-2 sm:gap-3 bg-white/70 text-[#0a5f39] border border-[#9ae6b4] backdrop-blur-sm pr-3 sm:pr-4 p-1 rounded-full text-xs transition-all duration-300 hover:bg-white/90 flex-wrap w-fit'>
                            <span className='bg-[rgb(5,223,114)] px-2 sm:px-3 py-1 rounded-full text-white text-xs font-bold'>NEW</span>
                            <span className='animate-pulse text-xs'>Fresh drops this week</span>
                            <ChevronRightIcon className='group-hover:ml-2 transition-all hidden sm:inline' size={14} />
                        </div>

                        <h2 className='mt-5 sm:mt-6 text-[2.1rem] leading-[0.9] sm:text-[2.8rem] md:text-[4rem] lg:text-[5rem] xl:text-[5.7rem] font-black tracking-[-0.08em] text-[#0b3b29] max-w-[240px] sm:max-w-[480px] animate-slideInUp' style={{ animationDelay: '0.1s' }}>
                            Upgrade your everyday essentials.
                        </h2>

                        <p className='mt-4 sm:mt-5 text-[#0f5132]/80 text-sm sm:text-lg lg:text-xl font-medium max-w-[260px] sm:max-w-[470px] animate-slideInUp' style={{ animationDelay: '0.15s' }}>
                            Smart finds, elevated quality, and unbeatable value all in one place.
                        </p>

                        <div className='mt-6 sm:mt-8 flex flex-wrap items-center gap-3 animate-slideInUp' style={{ animationDelay: '0.2s' }}>
                            <Link href="/shop">
                                <button className='bg-[rgb(5,223,114)] text-white text-base sm:text-lg font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-full hover:scale-[1.02] active:scale-95 transition btn-primary shadow-lg shadow-[rgba(5,223,114,0.35)] whitespace-nowrap'>
                                    Shop now
                                </button>
                            </Link>
                            <Link href="/shop">
                                <button className='border border-[#9ae6b4] bg-white/50 text-[#0b3b29] text-base sm:text-lg font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-full hover:bg-white/80 transition whitespace-nowrap'>
                                    View collection
                                </button>
                            </Link>
                        </div>

                        <div className='mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4 max-w-[500px] animate-slideInUp' style={{ animationDelay: '0.25s' }}>
                            <div className='rounded-[22px] border border-[#9ae6b4] bg-white/50 p-4 backdrop-blur-sm'>
                                <p className='text-[1.4rem] sm:text-[1.8rem] font-black text-[#0b3b29]'>{currency}399</p>
                                <p className='text-[10px] sm:text-xs text-[#0f5132] mt-1'>Starting from</p>
                            </div>
                            <div className='rounded-[22px] border border-[#9ae6b4] bg-white/50 p-4 backdrop-blur-sm'>
                                <p className='text-[1.4rem] sm:text-[1.8rem] font-black text-[#0b3b29]'>4.9/5</p>
                                <p className='text-[10px] sm:text-xs text-[#0f5132] mt-1'>Customer love</p>
                            </div>
                            <div className='rounded-[22px] border border-[#9ae6b4] bg-white/50 p-4 backdrop-blur-sm'>
                                <p className='text-[1.4rem] sm:text-[1.8rem] font-black text-[#0b3b29]'>1.5k+</p>
                                <p className='text-[10px] sm:text-xs text-[#0f5132] mt-1'>Products</p>
                            </div>
                        </div>
                    </div>

                    <div className='relative z-20 mt-4 flex justify-center sm:absolute sm:-right-2 sm:bottom-0 sm:mt-0 sm:w-[32%] sm:min-w-[210px] sm:max-w-[420px] lg:w-[360px] xl:w-[410px]'>
                        <img priority="true" className='block w-[72%] h-auto max-h-[280px] sm:w-full sm:max-h-[570px] object-contain animate-fadeInRight drop-shadow-[0_35px_35px_rgba(0,0,0,0.28)]' style={{ animationDelay: '0.2s' }} src={assets.hero_model_img} alt="Premium product showcase" />
                    </div>
                </div>

                <div className='flex flex-col md:flex-row xl:flex-col gap-3 sm:gap-5 w-full xl:max-w-sm text-xs sm:text-sm text-slate-600'>
                    <div className='flex-1 flex flex-col sm:flex-row items-center justify-between w-full rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 lg:p-6 group hover-lift card-animate animate-fadeInRight overflow-hidden relative border border-emerald-100' style={{ animationDelay: '0.1s', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
                        <div className='relative z-10'>
                            <p className='text-[11px] uppercase tracking-[0.18em] text-emerald-700 font-semibold'>Best sellers</p>
                            <p className='text-lg sm:text-2xl lg:text-[2rem] font-bold text-slate-900 max-w-40 mt-2'>Trending picks</p>
                            <Link href="/shop">
                                <p className='flex items-center gap-1 mt-2 sm:mt-4 transition-all duration-300 group-hover:gap-2 cursor-pointer text-slate-900 hover:underline text-xs sm:text-sm'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={14} /> </p>
                            </Link>
                        </div>
                        <div className='absolute inset-0 opacity-10 flex items-center justify-center text-3xl sm:text-5xl'>✦</div>
                        <img className='w-20 sm:w-24 lg:w-28 transition-transform duration-300 group-hover:scale-110 relative z-20 flex-shrink-0 mt-2 sm:mt-0' src={heroProductImg1.src || heroProductImg1} alt="Trending picks" />
                    </div>

                    <div className='flex-1 flex flex-col sm:flex-row items-center justify-between w-full rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 lg:p-6 group hover-lift card-animate animate-fadeInRight overflow-hidden relative border border-amber-100' style={{ animationDelay: '0.2s', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
                        <div className='relative z-10'>
                            <p className='text-[11px] uppercase tracking-[0.18em] text-amber-700 font-semibold'>Limited-time</p>
                            <p className='text-lg sm:text-2xl lg:text-[2rem] font-bold text-slate-900 max-w-40 mt-2'>Smart savings</p>
                            <p className='text-slate-700 text-xs sm:text-sm mt-1 sm:mt-2'>Up to 70% off</p>
                            <Link href="/shop">
                                <p className='flex items-center gap-1 mt-2 sm:mt-4 transition-all duration-300 group-hover:gap-2 cursor-pointer text-slate-900 hover:underline text-xs sm:text-sm'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={14} /> </p>
                            </Link>
                        </div>
                        <div className='absolute inset-0 opacity-10 flex items-center justify-center text-3xl sm:text-5xl'>★</div>
                        <img className='w-20 sm:w-24 lg:w-28 transition-transform duration-300 group-hover:scale-110 relative z-20 flex-shrink-0 mt-2 sm:mt-0' src={heroProductImg2.src || heroProductImg2} alt="Smart savings" />
                    </div>
                </div>
            </div>

            <div className='max-w-7xl mx-auto my-8 sm:my-12 rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-violet-50 p-4 sm:p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)] animate-fadeInUp'>
                <p className='text-center text-sm sm:text-lg md:text-xl font-semibold text-slate-800 max-w-3xl mx-auto px-2'>
                    “Fresh picks, smarter savings, and standout essentials for the season.”
                </p>
                <p className='text-center text-xs sm:text-sm text-slate-600 mt-3 sm:mt-4'>Offer valid till August 09, 2026</p>
            </div>

            <CategoriesMarquee />
        </div>

    )
}

export default HeroIndependenceDay
