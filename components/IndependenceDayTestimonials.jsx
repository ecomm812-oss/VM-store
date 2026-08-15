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
            text: 'Amazing Independence Day deals! Got premium gadgets at incredible prices. VM Cart is truly celebrating with us! 🇮🇳',
            avatar: '👨‍💼',
            title: 'Tech Enthusiast'
        },
        {
            id: 2,
            name: 'Priya Singh',
            location: 'Mumbai',
            rating: 5,
            text: 'Love the patriotic theme and the special offers! Fast delivery and excellent customer service. Best shopping experience!',
            avatar: '👩‍💼',
            title: 'Customer'
        },
        {
            id: 3,
            name: 'Arjun Patel',
            location: 'Bangalore',
            rating: 5,
            text: 'Supporting independence and getting amazing deals on quality products. This is how Independence Day shopping should be!',
            avatar: '👨‍🎓',
            title: 'Student'
        },
        {
            id: 4,
            name: 'Neha Sharma',
            location: 'Pune',
            rating: 5,
            text: 'The Independence Day collection is fantastic! Great variety, authentic products, and patriotic spirit throughout!',
            avatar: '👩‍🏫',
            title: 'Professional'
        },
        {
            id: 5,
            name: 'Vikram Desai',
            location: 'Hyderabad',
            rating: 5,
            text: 'Celebrating India independence with quality products from VM Cart. Proud to support local businesses! 🇮🇳',
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
                <h2 className='text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent mb-3'>
                    What Our Customers Say 🇮🇳
                </h2>
                <p className='text-slate-600 text-lg'>Celebrating Independence Day with our happy customers</p>
            </div>

            <div className='relative bg-gradient-to-r from-orange-50 via-white to-green-50 rounded-3xl p-8 md:p-12 border-2 border-orange-200 shadow-lg'>
                {/* Testimonial Content */}
                <div className='min-h-80 flex flex-col justify-between animate-fadeInUp'>
                    <div>
                        <div className='flex items-start gap-4'>
                            <div className='text-6xl'>{testimonials[currentIndex].avatar}</div>
                            <div className='flex-1'>
                                <div className='flex gap-1 mb-2'>
                                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                        <Star key={i} size={20} className='fill-yellow-400 text-yellow-400' />
                                    ))}
                                </div>
                                <p className='text-slate-800 text-lg md:text-xl leading-relaxed mb-4'>
                                    "{testimonials[currentIndex].text}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='mt-8'>
                        <p className='font-bold text-slate-800 text-lg'>{testimonials[currentIndex].name}</p>
                        <p className='text-sm text-slate-600'>{testimonials[currentIndex].title} • {testimonials[currentIndex].location}</p>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className='flex items-center justify-between mt-8'>
                    <button
                        onClick={prevSlide}
                        className='bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-110'
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* Dots */}
                    <div className='flex gap-2'>
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    index === currentIndex
                                        ? 'bg-gradient-to-r from-orange-500 to-green-600 w-8'
                                        : 'bg-slate-300 hover:bg-slate-400'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={nextSlide}
                        className='bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-110'
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Auto-play indicator */}
                <div className='text-center mt-4'>
                    <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className='text-xs text-slate-500 hover:text-slate-700 transition-colors'
                    >
                        {autoPlay ? '⏸️ Auto-playing' : '▶️ Paused'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default IndependenceDayTestimonials
