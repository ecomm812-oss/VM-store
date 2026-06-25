'use client'
import Image from "next/image";
import { DotIcon, TruckIcon, XCircleIcon } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";
import Link from "next/link";
import toast from "react-hot-toast";

const OrderItem = ({ order }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
    const [ratingModal, setRatingModal] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const { ratings } = useSelector(state => state.rating);

    const getProductImage = (images) => {
        if (!images) return '/placeholder.png';
        
        // If images is already an array
        if (Array.isArray(images)) {
            return images[0] || '/placeholder.png';
        }
        
        // If images is a JSON string
        if (typeof images === 'string') {
            try {
                const parsedImages = JSON.parse(images);
                if (Array.isArray(parsedImages)) {
                    return parsedImages[0] || '/placeholder.png';
                }
            } catch (e) {
                // If it's not JSON but a direct URL string
                if (images.startsWith('http') || images.startsWith('/')) {
                    return images;
                }
            }
        }
        
        return '/placeholder.png';
    };

    const canCancelOrder = () => {
        return order.status === 'ORDER_PLACED' || order.status === 'PROCESSING';
    };

    const cancelOrder = async () => {
        if (!canCancelOrder()) return;

        setIsCancelling(true);
        try {
            const response = await fetch('/api/orders/cancel', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.id
                })
            });

            if (response.ok) {
                toast.success('Order cancelled successfully');
                // Refresh the page to show updated status
                window.location.reload();
            } else {
                try {
                    const error = await response.json();
                    toast.error(error.error || 'Failed to cancel order');
                } catch {
                    toast.error('Failed to cancel order');
                }
            }
        } catch (error) {
            toast.error('Failed to cancel order');
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <>
            <tr className="text-sm animate-fadeInUp stagger-item hover:bg-slate-50 transition-colors duration-300">
                <td className="text-left">
                    <div className="flex flex-col gap-6">
                        {order && Array.isArray(order.orderItems) && order.orderItems.length > 0 ? (
                            order.orderItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 transition-transform duration-300 hover:translate-x-1">
                                    <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md hover:shadow-md transition-all duration-300 card-animate">
                                        <Image
                                            className="h-14 w-auto transition-transform duration-300 hover:scale-110"
                                            src={getProductImage(item?.product?.images)}
                                            alt="product_img"
                                            width={50}
                                            height={50}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center text-sm transition-all duration-300">
                                        <p className="font-medium text-slate-600 text-base">{item?.product?.name || 'Product'}</p>
                                        <p>{currency}{item?.price || 0} Qty : {item?.quantity || 0} </p>
                                        <p className="mb-1">{order?.createdAt ? new Date(order.createdAt).toDateString() : 'Date N/A'}</p>
                                        <div>
                                            {ratings.find(rating => order.id === rating.orderId && item?.product?.id === rating.productId)
                                                ? <Rating value={ratings.find(rating => order.id === rating.orderId && item?.product?.id === rating.productId).rating} />
                                                : <button onClick={() => setRatingModal({ orderId: order.id, productId: item?.product?.id })} className={`text-green-500 hover:bg-green-50 transition-all duration-300 hover:scale-105 ${order.status !== "DELIVERED" && 'hidden'}`}>Rate Product</button>
                                            }</div>
                                        {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 animate-pulse">No products found for this order</p>
                        )}
                    </div>
                </td>

                <td className="text-center max-md:hidden font-semibold transition-colors duration-300">{currency}{order.total}</td>

                <td className="text-left max-md:hidden transition-colors duration-300">
                    <p>{order?.address?.name || 'N/A'}, {order?.address?.street || 'N/A'},</p>
                    <p>{order?.address?.city || 'N/A'}, {order?.address?.state || 'N/A'}, {order?.address?.zip || 'N/A'}, {order?.address?.country || 'N/A'},</p>
                    <p>{order?.address?.phone || 'N/A'}</p>
                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden">
                    <div
                        className={`flex items-center justify-center gap-1 rounded-full p-1 transition-all duration-300 ${
                            order.status === 'ORDER_PLACED'
                                ? 'text-blue-600 bg-blue-100 hover:shadow-md'
                                : order.status === 'PROCESSING'
                                ? 'text-yellow-600 bg-yellow-100 hover:shadow-md'
                                : order.status === 'SHIPPED'
                                ? 'text-orange-600 bg-orange-100 hover:shadow-md'
                                : order.status === 'DELIVERED'
                                ? 'text-green-600 bg-green-100 hover:shadow-md'
                                : order.status === 'CANCELLED'
                                ? 'text-red-600 bg-red-100 hover:shadow-md'
                                : 'text-slate-600 bg-slate-100 hover:shadow-md'
                            }`}
                    >
                        <DotIcon size={10} className="scale-250 animate-pulse-custom" />
                        {order.status.split('_').join(' ').toLowerCase()}
                    </div>
                    <div className="flex gap-2 mt-2">
                        <Link
                            href={`/orders/${order.id}`}
                            className="flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800 text-xs transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <TruckIcon size={12} />
                            Track Order
                        </Link>
                        {canCancelOrder() && (
                            <button
                                onClick={cancelOrder}
                                disabled={isCancelling}
                                className="flex items-center justify-center gap-1 text-red-600 hover:text-red-800 text-xs disabled:opacity-50 transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <XCircleIcon size={12} />
                                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                        )}
                    </div>
                </td>
            </tr>
            {/* Mobile */}
            <tr className="md:hidden">
                <td colSpan={5} className="animate-fadeInUp stagger-item">
                    <p>{order?.address?.name || 'N/A'}, {order?.address?.street || 'N/A'}</p>
                    <p>{order?.address?.city || 'N/A'}, {order?.address?.state || 'N/A'}, {order?.address?.zip || 'N/A'}, {order?.address?.country || 'N/A'}</p>
                    <p>{order?.address?.phone || 'N/A'}</p>
                    <br />
                    <div className="flex items-center">
                        <span className={`text-center mx-auto px-6 py-1.5 rounded transition-all duration-300 ${
                            order.status === 'ORDER_PLACED'
                                ? 'bg-blue-100 text-blue-700'
                                : order.status === 'PROCESSING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : order.status === 'SHIPPED'
                                ? 'bg-orange-100 text-orange-700'
                                : order.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                            }`} >
                            {order?.status?.replace(/_/g, ' ').toLowerCase() || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-center gap-2 mt-2">
                        <Link
                            href={`/orders/${order.id}`}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                            <TruckIcon size={14} />
                            Track Order
                        </Link>
                        {canCancelOrder() && (
                            <button
                                onClick={cancelOrder}
                                disabled={isCancelling}
                                className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                            >
                                <XCircleIcon size={14} />
                                {isCancelling ? 'Cancelling...' : 'Cancel'}
                            </button>
                        )}
                    </div>
                </td>
            </tr>
            <tr>
                <td colSpan={4}>
                    <div className="border-b border-slate-300 w-6/7 mx-auto" />
                </td>
            </tr>
        </>
    )
}

export default OrderItem