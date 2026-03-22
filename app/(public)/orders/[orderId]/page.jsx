'use client'
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import Loading from "@/components/Loading";
import { MapPinIcon, TruckIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";
import Image from "next/image";

export default function OrderTracking() {
    const { orderId } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrder(data);
                } else if (response.status === 404) {
                    setError("Order not found");
                } else {
                    setError("Failed to fetch order details");
                }
            } catch (error) {
                setError("Failed to fetch order details");
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'ORDER_PLACED':
                return <ClockIcon className="w-6 h-6 text-blue-500" />;
            case 'PROCESSING':
                return <ClockIcon className="w-6 h-6 text-yellow-500" />;
            case 'SHIPPED':
                return <TruckIcon className="w-6 h-6 text-orange-500" />;
            case 'DELIVERED':
                return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
            case 'CANCELLED':
                return <XCircleIcon className="w-6 h-6 text-red-500" />;
            default:
                return <ClockIcon className="w-6 h-6 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ORDER_PLACED':
                return 'text-blue-600 bg-blue-100';
            case 'PROCESSING':
                return 'text-yellow-600 bg-yellow-100';
            case 'SHIPPED':
                return 'text-orange-600 bg-orange-100';
            case 'DELIVERED':
                return 'text-green-600 bg-green-100';
            case 'CANCELLED':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) return <Loading />;

    if (error) {
        return (
            <div className="min-h-[70vh] mx-6 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-red-600 mb-4">{error}</h1>
                    <button
                        onClick={() => router.push('/orders')}
                        className="px-6 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="my-20 max-w-6xl mx-auto">
                <PageTitle
                    heading={`Order #${order.id.slice(-8)}`}
                    text="Track your order status and delivery details"
                    linkText="Back to Orders"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Order Status & Tracking */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Timeline */}
                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Order Status</h2>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    {getStatusIcon('ORDER_PLACED')}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-slate-800">Order Placed</h3>
                                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor('ORDER_PLACED')}`}>
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1">Your order has been received</p>
                                    </div>
                                </div>

                                {['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                                    <div key={status} className="flex items-center space-x-4">
                                        {getStatusIcon(status)}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium text-slate-800">
                                                    {status.replace('_', ' ')}
                                                </h3>
                                                {order.status === status && (
                                                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(status)}`}>
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">
                                                {status === 'PROCESSING' && 'Your order is being prepared'}
                                                {status === 'SHIPPED' && 'Your order has been shipped'}
                                                {status === 'DELIVERED' && 'Your order has been delivered'}
                                                {status === 'CANCELLED' && 'Your order has been cancelled'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tracking Information */}
                        {(order.trackingNumber || order.trackingUrl || order.currentLocation) && (
                            <div className="bg-white p-6 rounded-lg shadow-md border">
                                <h2 className="text-xl font-semibold text-slate-800 mb-6">Tracking Details</h2>

                                <div className="space-y-4">
                                    {order.trackingNumber && (
                                        <div className="flex items-center space-x-3">
                                            <TruckIcon className="w-5 h-5 text-slate-500" />
                                            <div>
                                                <p className="font-medium text-slate-800">Tracking Number</p>
                                                <p className="text-sm text-slate-600">{order.trackingNumber}</p>
                                            </div>
                                        </div>
                                    )}

                                    {order.trackingUrl && (
                                        <div className="flex items-center space-x-3">
                                            <MapPinIcon className="w-5 h-5 text-slate-500" />
                                            <div>
                                                <p className="font-medium text-slate-800">Tracking Link</p>
                                                <a
                                                    href={order.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                                                >
                                                    Track your package
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {order.currentLocation && (
                                        <div className="flex items-center space-x-3">
                                            <MapPinIcon className="w-5 h-5 text-slate-500" />
                                            <div>
                                                <p className="font-medium text-slate-800">Current Location</p>
                                                <p className="text-sm text-slate-600">{order.currentLocation}</p>
                                            </div>
                                        </div>
                                    )}

                                    {order.estimatedDelivery && (
                                        <div className="flex items-center space-x-3">
                                            <ClockIcon className="w-5 h-5 text-slate-500" />
                                            <div>
                                                <p className="font-medium text-slate-800">Estimated Delivery</p>
                                                <p className="text-sm text-slate-600">
                                                    {new Date(order.estimatedDelivery).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Order Items */}
                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Order Items</h2>

                            <div className="space-y-4">
                                {order.orderItems && order.orderItems.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg">
                                        <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center">
                                            <Image
                                                src={item.product?.images?.[0] || '/placeholder.png'}
                                                alt={item.product?.name || 'Product'}
                                                width={50}
                                                height={50}
                                                className="object-cover rounded"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-slate-800">{item.product?.name || 'Product'}</h3>
                                            <p className="text-sm text-slate-600">
                                                Quantity: {item.quantity} | Size: {item.selectedSize}
                                            </p>
                                            <p className="text-sm font-medium text-slate-800">
                                                {currency}{item.price}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Order Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Order ID</span>
                                    <span className="font-medium">#{order.id.slice(-8)}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-600">Status</span>
                                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-600">Payment Method</span>
                                    <span className="font-medium">{order.paymentMethod}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-600">Payment Status</span>
                                    <span className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                        {order.isPaid ? 'Paid' : 'Pending'}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-600">Order Date</span>
                                    <span className="font-medium">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span>Total</span>
                                        <span>{currency}{order.total}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Shipping Address</h2>

                            <div className="space-y-2">
                                <p className="font-medium text-slate-800">{order.address?.name}</p>
                                <p className="text-slate-600">{order.address?.street}</p>
                                <p className="text-slate-600">
                                    {order.address?.city}, {order.address?.state} {order.address?.zip}
                                </p>
                                <p className="text-slate-600">{order.address?.country}</p>
                                <p className="text-slate-600">{order.address?.phone}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}