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
            <div className='relative rounded-[32px] overflow-hidden shadow-[0_25px_60px_rgba(15,23,42,0.12)] border border-slate-200'>
                <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.3),_transparent_40%),linear-gradient(135deg,_#0f172a_0%,_#1f2937_35%,_#312e81_100%)]'></div>

                <div className='absolute inset-0 opacity-15'>
                    <div className='absolute top-6 left-8 text-7xl sm:text-8xl animate-bounce'>✦</div>
                    <div className='absolute top-20 right-10 text-6xl sm:text-7xl animate-bounce' style={{ animationDelay: '0.5s' }}>★</div>
                    <div className='absolute bottom-8 left-20 text-6xl sm:text-7xl animate-bounce' style={{ animationDelay: '1s' }}>⚡</div>
                    <div className='absolute bottom-10 right-16 text-5xl sm:text-6xl animate-bounce' style={{ animationDelay: '0.7s' }}>✦</div>
                </div>

                <div className='relative z-10 px-6 md:px-12 py-12 md:py-16 text-center'>
                    <div className='flex items-center justify-center gap-3 mb-4 animate-fadeInDown'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20'>
                            <Heart className='text-white animate-pulse' size={24} />
                        </div>
                        <h2 className='text-3xl md:text-4xl font-black text-white'>
                            Stay in the loop
                        </h2>
                    </div>

                    <p className='text-white text-lg md:text-xl mb-2 font-semibold'>
                        Get exclusive deals & offers
                    </p>

                    <p className='text-white text-sm md:text-base opacity-90 mb-8 max-w-2xl mx-auto'>
                        Subscribe to our newsletter for discounts, early access to special offers, and curated product picks delivered straight to your inbox.
                    </p>

                    <form onSubmit={handleSubmit} className='flex flex-col md:flex-row gap-3 max-w-2xl mx-auto mb-6 animate-slideInUp'>
                        <div className='flex-1 relative'>
                            <Mail className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400' size={20} />
                            <input
                                type='email'
                                placeholder='Enter your email address'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className='w-full pl-12 pr-4 py-4 rounded-full text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all duration-300'
                                required
                            />
                        </div>
                        <button
                            type='submit'
                            disabled={loading}
                            className='bg-white text-slate-900 px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] active:scale-95 disabled:opacity-70'
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
                        <div className='animate-bounce bg-emerald-500 text-white px-6 py-3 rounded-full max-w-xl mx-auto text-sm md:text-base font-semibold'>
                            🎉 Thank you! Check your email for upcoming offers and fresh arrivals.
                        </div>
                    )}

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto'>
                        <div className='bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 text-white animate-fadeInLeft'>
                            <p className='text-2xl mb-2'>🎁</p>
                            <p className='font-semibold'>Exclusive Deals</p>
                            <p className='text-sm text-white/85'>Special offers just for subscribers</p>
                        </div>
                        <div className='bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 text-white animate-fadeInUp'>
                            <p className='text-2xl mb-2'>⚡</p>
                            <p className='font-semibold'>Early Access</p>
                            <p className='text-sm text-white/85'>Get first dibs on new arrivals</p>
                        </div>
                        <div className='bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4 text-white animate-fadeInRight'>
                            <p className='text-2xl mb-2'>✦</p>
                            <p className='font-semibold'>Fresh Inspiration</p>
                            <p className='text-sm text-white/85'>Curated picks for your next favorite find</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default IndependenceDayNewsletter
