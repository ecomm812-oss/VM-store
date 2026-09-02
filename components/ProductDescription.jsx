'use client'
import { ArrowRight, StarIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import RatingModal from './RatingModal'

const ProductDescription = ({ product }) => {
    const safeProduct = product || {}

    const [selectedTab, setSelectedTab] = useState('Description')
    const [ratingModal, setRatingModal] = useState(null)
    const [reviewEligibility, setReviewEligibility] = useState(null)
    const reviews = Array.isArray(safeProduct?.rating) ? safeProduct.rating : []
    const reviewCount = typeof safeProduct?._count?.rating === 'number' ? safeProduct._count.rating : reviews.length
    const averageRating = typeof safeProduct?.ratingAvg === 'number'
        ? safeProduct.ratingAvg
        : reviews.length > 0
            ? reviews.reduce((acc, item) => acc + (item.rating || 0), 0) / reviews.length
            : 0;

    useEffect(() => {
        if (!safeProduct?.id || selectedTab !== 'Reviews') return

        const fetchEligibility = async () => {
            try {
                const response = await fetch(`/api/rating?productId=${safeProduct.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setReviewEligibility(data?.eligible ? data : { eligible: false, message: 'Reviews can be submitted after a delivered order.' })
                } else {
                    setReviewEligibility({ eligible: false, message: 'Please sign in to leave a review.' })
                }
            } catch (error) {
                setReviewEligibility({ eligible: false, message: 'Unable to check review eligibility right now.' })
            }
        }

        fetchEligibility()
    }, [safeProduct?.id, selectedTab])

    return (
        <div className="my-18 text-sm text-slate-600">

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                {['Description', 'Reviews'].map((tab, index) => (
                    <button className={`${tab === selectedTab ? 'border-b-[1.5px] font-semibold' : 'text-slate-400'} px-3 py-2 font-medium`} key={index} onClick={() => setSelectedTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Description */}
            {selectedTab === "Description" && (
                <div className="max-w-2xl space-y-4">
                    <p>{safeProduct.description || 'No description available.'}</p>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">Shipping & returns</p>
                        <ul className="mt-2 space-y-1">
                            <li>• Delivery charges start from {product?.price >= 499 ? 'free' : `₹49`} for this item.</li>
                            <li>• Easy return window of 7 days from delivery.</li>
                            <li>• Estimated delivery is usually within 5 business days.</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Reviews */}
            {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-3 mt-8">
                    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-lg font-semibold text-slate-800">Customer reviews</p>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                {Array(5).fill('').map((_, index) => (
                                    <StarIcon key={index} size={18} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                                ))}
                            </div>
                            <p className="text-sm text-slate-600">{averageRating.toFixed(1)} out of 5 from {reviewCount} reviews</p>
                        </div>
                    </div>
                    {reviewCount > 0 ? (
                        <>
                            {reviewCount > reviews.length ? (
                                <p className="text-sm text-slate-500 mb-4">Showing latest {reviews.length} of {reviewCount} reviews.</p>
                            ) : null}
                            {reviews.map((item, index) => (
                                <div key={index} className="flex gap-5 mb-10">
                                    <Image src={item?.user?.image || '/placeholder.png'} alt="" className="size-10 rounded-full" width={100} height={100} />
                                    <div>
                                        <div className="flex items-center" >
                                            {Array(5).fill('').map((_, index) => (
                                                <StarIcon key={index} size={18} className='text-transparent mt-0.5' fill={item.rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                                            ))}
                                        </div>
                                        <p className="text-sm max-w-lg my-4">{item.review}</p>
                                        <p className="font-medium text-slate-800">{item?.user?.name || 'Anonymous'}</p>
                                        <p className="mt-3 font-light">{item?.createdAt ? new Date(item.createdAt).toDateString() : 'Date unavailable'}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <p className="text-slate-500">No reviews yet</p>
                    )}
                    <div className="mt-6">
                        {reviewEligibility?.eligible ? (
                            <button
                                onClick={() => setRatingModal({ productId: safeProduct.id, orderId: reviewEligibility.orderId })}
                                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition"
                            >
                                Rate this product
                            </button>
                        ) : reviewEligibility === null ? (
                            <p className="text-sm text-slate-500">Checking eligibility...</p>
                        ) : (
                            <p className="text-sm text-slate-500">{reviewEligibility?.message || 'Reviews can be submitted after a delivered order.'}</p>
                        )}
                    </div>
                </div>
            )}
            {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}

            {/* Store Page */}
            {safeProduct?.store && (
                <div className="flex gap-3 mt-14">
                    <Image src={safeProduct.store.logo || '/placeholder.png'} alt="" className="size-11 rounded-full ring ring-slate-400" width={100} height={100} />
                    <div>
                        {safeProduct.store.username ? (
                            <Link href={`/shop/${encodeURIComponent(safeProduct.store.username)}`} className="flex items-center gap-1.5 text-green-500"> view store <ArrowRight size={14} /></Link>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductDescription