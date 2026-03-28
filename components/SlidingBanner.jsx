'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

export default function SlidingBanner() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch banners from API
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await fetch('/api/banners');
                const data = await response.json();
                setBanners(data.banners || []);
            } catch (error) {
                console.error('Failed to fetch banners:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    // Auto-slide every 5 seconds
    useEffect(() => {
        if (banners.length === 0) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [banners.length]);

    const nextSlide = () => {
        if (banners.length > 0) {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }
    };

    const prevSlide = () => {
        if (banners.length > 0) {
            setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
        }
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    if (loading) {
        return (
            <div className="relative w-full h-96 md:h-[500px] bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl shadow-2xl animate-pulse flex items-center justify-center">
                <p className="text-slate-600">Loading banners...</p>
            </div>
        );
    }

    if (banners.length === 0) {
        return (
            <div className="relative w-full h-96 md:h-[500px] bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-2xl flex items-center justify-center">
                <p className="text-white text-lg">No banners available yet</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-96 md:h-[500px] overflow-hidden rounded-xl shadow-2xl">
            {/* Banner Slides */}
            {banners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={`absolute w-full h-full transition-opacity duration-1000 ease-in-out ${
                        index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-slate-900/20 z-10"></div>

                    {/* Image */}
                    <div className="absolute inset-0">
                        {banner.imageUrl ? (
                            <img
                                src={banner.imageUrl}
                                alt={banner.title || 'Banner image'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    console.error('Banner image load error:', banner.imageUrl)
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%221200%22%20height=%22500%22%3E%3Crect%20width=%221200%22%20height=%22500%22%20fill=%22%236b7280%22/%3E%3Ctext%20x=%2250%22%20y=%22270%22%20font-size=%2230%22%20fill=%22white%22%3EImage%20unavailable%20or%20failed%20to%20load%3C/text%3E%3C/svg%3E'
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-400 flex items-center justify-center">
                                <span className="text-white text-lg">Image not available</span>
                            </div>
                        )}
                    </div>

                    {/* Text Content */}
                    <div className="absolute inset-0 flex flex-col justify-center items-center z-20 text-white text-center px-6">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                            {banner.title}
                        </h2>
                        <p className="text-lg md:text-xl mb-8 drop-shadow-md max-w-2xl">
                            {banner.description}
                        </p>
                        <button className="bg-white text-slate-800 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                            Shop Now
                        </button>
                    </div>
                </div>
            ))}

            {/* Previous Button */}
            <button
                onClick={prevSlide}
                className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Previous slide"
            >
                <ChevronLeftIcon size={28} />
            </button>

            {/* Next Button */}
            <button
                onClick={nextSlide}
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Next slide"
            >
                <ChevronRightIcon size={28} />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-3 rounded-full transition-all duration-300 ${
                            index === currentSlide
                                ? 'bg-white w-8'
                                : 'bg-white/50 w-3 hover:bg-white/75'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
