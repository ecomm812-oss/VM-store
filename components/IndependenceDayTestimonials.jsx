'use client'
import React, { useState, useEffect } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

const IndependenceDayTestimonials = () => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [autoPlay, setAutoPlay] = useState(true)

    const testimonials = [
        {
            id: 1,
            name: 'Rajesh Kumar',
            location: 'Delhi',
            rating: 5,
            text: 'The collection is beautiful! Found the perfect items and the deals were brilliant. VM Cart made shopping feel easy and enjoyable.',
            avatar: '👨‍💼',
            title: 'Tech Enthusiast'
        },
        {
            id: 2,
            name: 'Priya Singh',
            location: 'Mumbai',
            rating: 5,
            text: 'Loved the curated offers and the smooth shopping experience. Fast delivery and excellent service made the whole order stress-free.',
            avatar: '👩‍💼',
            title: 'Customer'
        },
        {
            id: 3,
            name: 'Arjun Patel',
            location: 'Bangalore',
            rating: 5,
            text: 'The seasonal specials were so well-curated. Great value, quality products, and a warm shopping experience from start to finish.',
            avatar: '👨‍🎓',
            title: 'Student'
        },
        {
            id: 4,
            name: 'Neha Sharma',
            location: 'Pune',
            rating: 5,
            text: 'The product range is stunning! A perfect mix of everyday essentials and thoughtful finds that fit my lifestyle.',
            avatar: '👩‍🏫',
            title: 'Professional'
        },
        {
            id: 5,
            name: 'Vikram Desai',
            location: 'Hyderabad',
            rating: 5,
            text: 'Shopping from VM Cart felt genuinely special. The selection was thoughtful, the value was excellent, and the entire experience was smooth.',
            avatar: '👨‍🏥',
            title: 'Entrepreneur'
        }
    ]

    useEffect(() => {
        if (!autoPlay) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [autoPlay, testimonials.length])

    const nextSlide = () => {
        setAutoPlay(false)
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }

    const prevSlide = () => {
        setAutoPlay(false)
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    }

    const goToSlide = (index) => {
        setAutoPlay(false)
        setCurrentIndex(index)
    }

    return (
        <div className='max-w-7xl mx-auto my-16 mx-6'>
            <div className='text-center mb-12 animate-fadeInUp'>
                <p className='text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 mb-3'>Reviews</p>
                <h2 className='text-3xl md:text-4xl font-black text-slate-900 mb-3'>
                    What Our Customers Say
                </h2>
                <p className='text-slate-600 text-lg'>Loved by shoppers looking for great finds and better value</p>
            </div>

            <div className='relative bg-white rounded-[32px] p-8 md:p-12 border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.05)]'>
                <div className='min-h-80 flex flex-col justify-between animate-fadeInUp'>
                    <div>
                        <div className='flex items-start gap-4'>
                            <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-3xl shadow-sm'>{testimonials[currentIndex].avatar}</div>
                            <div className='flex-1'>
                                <div className='flex gap-1 mb-2'>
                                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                        <Star key={i} size={20} className='fill-amber-400 text-amber-400' />
                                    ))}
                                </div>
                                <p className='text-slate-800 text-lg md:text-xl leading-relaxed mb-4'>
                                    "{testimonials[currentIndex].text}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='mt-8 flex items-center justify-between gap-4'>
                        <div>
                            <p className='font-bold text-slate-800 text-lg'>{testimonials[currentIndex].name}</p>
                            <p className='text-sm text-slate-600'>{testimonials[currentIndex].title} • {testimonials[currentIndex].location}</p>
                        </div>
                        <button
                            onClick={() => setAutoPlay(!autoPlay)}
                            className='text-xs text-slate-500 hover:text-slate-700 transition-colors rounded-full border border-slate-200 px-3 py-1.5'
                        >
                            {autoPlay ? 'Auto-playing' : 'Paused'}
                        </button>
                    </div>
                </div>

                <div className='flex items-center justify-between mt-8'>
                    <button
                        onClick={prevSlide}
                        className='bg-slate-900 text-white p-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-110'
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className='flex gap-2'>
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                    index === currentIndex
                                        ? 'bg-violet-600 w-8'
                                        : 'bg-slate-300 hover:bg-slate-400 w-2.5'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={nextSlide}
                        className='bg-violet-600 text-white p-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-110'
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default IndependenceDayTestimonials
