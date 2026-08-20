'use client'
import React, { useState } from 'react'
import { Mail, Send, Heart } from 'lucide-react'

const IndependenceDayNewsletter = () => {
    const [email, setEmail] = useState('')
    const [subscribed, setSubscribed] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            setSubscribed(true)
            setEmail('')
            setTimeout(() => setSubscribed(false), 3000)
        } catch (error) {
            console.error('Subscription error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='max-w-7xl mx-auto my-16 mx-6'>
            <div className='relative rounded-3xl overflow-hidden shadow-2xl'>
                <div className='absolute inset-0 bg-gradient-to-r from-[#7a0b2d] via-[#fbe4ee] to-[#d4a124] opacity-90'></div>

                <div className='absolute inset-0 opacity-10'>
                    <div className='absolute top-0 left-0 text-9xl animate-bounce' style={{ animationDelay: '0s' }}>🎀</div>
                    <div className='absolute top-20 right-10 text-8xl animate-bounce' style={{ animationDelay: '0.5s' }}>💐</div>
                    <div className='absolute bottom-10 left-20 text-7xl animate-bounce' style={{ animationDelay: '1s' }}>🎁</div>
                    <div className='absolute bottom-20 right-0 text-8xl animate-bounce' style={{ animationDelay: '0.7s' }}>💝</div>
                </div>

                {/* Content */}
                <div className='relative z-10 px-6 md:px-12 py-12 md:py-16 text-center'>
                    <div className='flex items-center justify-center gap-3 mb-4 animate-fadeInDown'>
                        <Heart className='text-white animate-pulse' size={28} />
                        <h2 className='text-3xl md:text-4xl font-bold text-white'>
                            Celebrate Raksha Bandhan
                        </h2>
                        <Heart className='text-white animate-pulse' size={28} />
                    </div>

                    <p className='text-white text-lg md:text-xl mb-2 font-semibold'>
                        Get Exclusive Festive Deals & Offers
                    </p>

                    <p className='text-white text-sm md:text-base opacity-90 mb-8 max-w-2xl mx-auto'>
                        Subscribe to our Raksha Bandhan newsletter and receive exclusive discounts, early access to special offers, and curated gifting picks delivered straight to your inbox. 🎁
                    </p>

                    {/* Newsletter Form */}
                    <form onSubmit={handleSubmit} className='flex flex-col md:flex-row gap-3 max-w-2xl mx-auto mb-6 animate-slideInUp'>
                        <div className='flex-1 relative'>
                            <Mail className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400' size={20} />
                            <input
                                type='email'
                                placeholder='Enter your email address'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className='w-full pl-12 pr-4 py-4 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300'
                                required
                            />
                        </div>
                        <button
                            type='submit'
                            disabled={loading}
                            className='bg-gradient-to-r from-[#5c0a2d] to-[#2b0f1b] text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-70'
                        >
                            {loading ? (
                                <span className='animate-spin'>⏳</span>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Subscribe
                                </>
                            )}
                        </button>
                    </form>

                    {subscribed && (
                        <div className='animate-bounce bg-[#2d9b6c] text-white px-6 py-3 rounded-lg max-w-xl mx-auto text-sm md:text-base font-semibold'>
                            🎉 Thank you! Check your email for exclusive Raksha Bandhan offers!
                        </div>
                    )}

                    {/* Benefits */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto'>
                        <div className='bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-white animate-fadeInLeft'>
                            <p className='text-2xl mb-2'>🎁</p>
                            <p className='font-semibold'>Exclusive Deals</p>
                            <p className='text-sm text-white text-opacity-90'>Special offers just for subscribers</p>
                        </div>
                        <div className='bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-white animate-fadeInUp'>
                            <p className='text-2xl mb-2'>⚡</p>
                            <p className='font-semibold'>Early Access</p>
                            <p className='text-sm text-white text-opacity-90'>Get first dibs on festive products</p>
                        </div>
                        <div className='bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-white animate-fadeInRight'>
                            <p className='text-2xl mb-2'>💝</p>
                            <p className='font-semibold'>Festive Joy</p>
                            <p className='text-sm text-white text-opacity-90'>Exclusive Raksha Bandhan inspiration</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default IndependenceDayNewsletter
