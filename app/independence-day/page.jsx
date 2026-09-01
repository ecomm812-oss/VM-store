'use client'
import React from 'react'
import HeroIndependenceDay from '@/components/HeroIndependenceDay'
import CountdownTimer from '@/components/CountdownTimer'
import IndependenceDayNewsletter from '@/components/IndependenceDayNewsletter'
import LatestProducts from '@/components/LatestProducts'
import BestSelling from '@/components/BestSelling'
import OurSpecs from '@/components/OurSpec'

const IndependenceDayPage = ({ latestProducts = [], bestSellingProducts = [] }) => {
    return (
        <main className='min-h-screen bg-white'>
            {/* Hero Section */}
            <HeroIndependenceDay />

            {/* Countdown Timer */}
            <CountdownTimer 
                targetDate='2026-08-09' 
                title='Limited-time offer ends soon'
            />

            <div className='max-w-7xl mx-auto mx-6 my-16'>
                <div className='text-center mb-12 animate-fadeInUp'>
                    <h2 className='text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#7a0b2d] to-[#d4a124] bg-clip-text text-transparent mb-3'>
                        Special picks for every day
                    </h2>
                    <p className='text-slate-600 text-lg'>Handpicked products, great value, and everyday essentials</p>
                </div>
            </div>

            {/* Latest Products */}
            {latestProducts.length > 0 && (
                <LatestProducts 
                    products={latestProducts}
                    showIndependenceBadges={true}
                />
            )}

            {/* Best Selling Products */}
            {bestSellingProducts.length > 0 && (
                <BestSelling 
                    products={bestSellingProducts}
                    showIndependenceBadges={true}
                />
            )}

            {/* Newsletter */}
            <IndependenceDayNewsletter />

            {/* Features Section */}
            <OurSpecs />

            {/* Final CTA Banner */}
            <div className='max-w-7xl mx-auto mx-6 my-16'>
                <div className='relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-400 via-yellow-300 to-green-500 p-12 text-center shadow-2xl animate-fadeInUp'>
                    <div className='absolute inset-0 opacity-10'>
                        <div className='absolute inset-0 bg-pattern'></div>
                    </div>
                    <div className='relative z-10'>
                        <h3 className='text-3xl md:text-4xl font-bold text-white mb-4'>
                            Discover fresh deals today
                        </h3>
                        <p className='text-white text-lg mb-6 max-w-2xl mx-auto'>
                            Browse handpicked essentials, trending finds, and limited-time savings at VM Cart.
                        </p>
                        <a href='/shop' className='inline-block bg-white text-[#7a0b2d] font-bold px-8 py-4 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105'>
                            Continue Shopping 🛍️
                        </a>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default IndependenceDayPage
