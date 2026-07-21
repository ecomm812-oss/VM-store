'use client'

import { Star } from 'lucide-react';
import React, { useState } from 'react'
import { XIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const RatingModal = ({ ratingModal, setRatingModal }) => {

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    const handleSubmit = async () => {
        if (rating < 1 || rating > 5) {
            toast('Please select a rating');
            return;
        }

        const normalizedReview = review.trim();
        if (normalizedReview && normalizedReview.length < 3) {
            toast('Please write at least 3 characters if you want to add a comment');
            return;
        }

        try {
            const response = await fetch('/api/rating', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating,
                    review: normalizedReview,
                    productId: ratingModal.productId,
                    orderId: ratingModal.orderId
                })
            });

            if (response.ok) {
                toast.success('Rating submitted successfully!');
                setRatingModal(null);
                // Optionally refresh the page to show the new rating
                window.location.reload();
            } else {
                try {
                    const error = await response.json();
                    toast.error(error.error || 'Failed to submit rating');
                } catch {
                    toast.error('Failed to submit rating');
                }
            }
        } catch (error) {
            toast.error('Failed to submit rating');
        }
    }

    return (
        <div className='fixed inset-0 z-120 flex items-center justify-center bg-black/10 animate-fadeIn'>
            <div className='bg-white p-8 rounded-lg shadow-lg w-96 relative animate-scaleIn'>
                <button onClick={() => setRatingModal(null)} className='absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-all duration-300 hover:scale-125 hover:rotate-90'>
                    <XIcon size={20} />
                </button>
                <h2 className='text-xl font-medium text-slate-600 mb-4 animate-slideInDown'>Rate Product</h2>
                <div className='flex items-center justify-center mb-4'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-8 cursor-pointer transition-all duration-300 ${rating > i ? "text-green-400 fill-current scale-125" : "text-gray-300 hover:scale-110"}`}
                            onClick={() => setRating(i + 1)}
                        />
                    ))}
                </div>
                <label className='block text-sm font-medium text-slate-600 mb-2'>Your comment</label>
                <textarea
                    className='w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300'
                    placeholder='Share your experience about this product (optional)'
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                ></textarea>
                <button onClick={e => toast.promise(handleSubmit(), { loading: 'Submitting...' })} className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-all duration-300 btn-primary hover:shadow-lg'>
                    Submit Rating
                </button>
            </div>
        </div>
    )
}

export default RatingModal