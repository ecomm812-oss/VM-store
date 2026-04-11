'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Loading from "@/components/Loading"
import { TruckIcon, MapPinIcon, ClockIcon } from "lucide-react"

export default function StoreOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [trackingNumber, setTrackingNumber] = useState('')
    const [trackingUrl, setTrackingUrl] = useState('')
    const [currentLocation, setCurrentLocation] = useState('')
    const [estimatedDelivery, setEstimatedDelivery] = useState('')

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders/store', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            if (response.ok) {
                const data = await response.json()
                setOrders(data)
            } else {
                const errorData = await response.json().catch(() => ({}))

                if (response.status === 401) {
                    toast.error('Authentication required. Please login again.')
                    return
                }

                toast.error(errorData.error || 'Failed to fetch orders')
            }
        } catch (error) {
            toast.error('Failed to fetch orders')
        } finally {
            setLoading(false)
        }
    }

    const updateOrderStatus = async (orderId, status) => {
        const response = await fetch('/api/orders/store', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: orderId,
                status: status
            })
        })

        if (response.ok) {
            const updatedOrder = await response.json()
            setOrders(orders.map(o => o.id === orderId ? updatedOrder : o))
            return updatedOrder
        } else {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update order status')
        }
    }

    const updateTrackingInfo = async () => {
        if (!selectedOrder) {
            toast.error('No order selected')
            return;
        }

        try {
            // Validate at least one field is provided
            if (!trackingNumber?.trim() && !trackingUrl?.trim() && !currentLocation?.trim() && !estimatedDelivery) {
                toast.error('Please provide at least one tracking detail')
                return;
            }

            const response = await fetch('/api/orders/store/tracking', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    trackingNumber: trackingNumber?.trim() || '',
                    trackingUrl: trackingUrl?.trim() || '',
                    currentLocation: currentLocation?.trim() || '',
                    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : null
                })
            })

            if (response.ok) {
                const updatedOrder = await response.json()
                setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o))
                setSelectedOrder(updatedOrder)
                toast.success('Tracking information updated!')
            } else {
                const errorData = await response.json()
                console.error('Tracking update error:', errorData)
                toast.error(errorData.error || 'Failed to update tracking information')
            }
        } catch (error) {
            console.error('Tracking update exception:', error)
            toast.error('An error occurred while updating tracking information')
        }
    }

    const openModal = (order) => {
        // Defensive check to ensure order has required properties
        if (!order || !order.id) {
            console.error('Invalid order passed to openModal:', order);
            return;
        }
        
        // Ensure orderItems exists and is an array
        if (!order.orderItems) {
            order.orderItems = [];
        }
        
        setSelectedOrder(order);
        setTrackingNumber(order.trackingNumber || '');
        setTrackingUrl(order.trackingUrl || '');
        setCurrentLocation(order.currentLocation || '');
        setEstimatedDelivery(order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '');
        setIsModalOpen(true);
    }

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    }

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Store <span className="text-slate-800 font-medium">Orders</span></h1>
            {orders.length === 0 ? (
                <p>No orders found</p>
            ) : (
                <div className="overflow-x-auto max-w-4xl rounded-md shadow border border-gray-200">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider">
                            <tr>
                                {["Sr. No.", "Customer", "Total", "Payment", "Coupon", "Status", "Date"].map((heading, i) => (
                                    <th key={i} className="px-4 py-3">{heading}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map((order, index) => (
                                <tr
                                    key={order.id}
                                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                    onClick={() => openModal(order)}
                                >
                                    <td className="pl-6 text-green-600" >
                                        {index + 1}
                                    </td>
                                    <td className="px-4 py-3">{order.user?.name}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">₹{order.total}</td>
                                    <td className="px-4 py-3">{order.paymentMethod}</td>
                                    <td className="px-4 py-3">
                                        {order.isCouponUsed ? (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                                {order.coupon?.code}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="px-4 py-3" onClick={(e) => { e.stopPropagation() }}>
                                        <select
                                            value={order.status}
                                            onChange={e => toast.promise(updateOrderStatus(order.id, e.target.value), { loading: "Updating status...", success: "Status updated!", error: (err) => err.message })}
                                            className="border-gray-300 rounded-md text-sm focus:ring focus:ring-blue-200"
                                        >
                                            <option value="ORDER_PLACED">ORDER_PLACED</option>
                                            <option value="PROCESSING">PROCESSING</option>
                                            <option value="SHIPPED">SHIPPED</option>
                                            <option value="DELIVERED">DELIVERED</option>
                                            <option value="CANCELLED">CANCELLED</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && selectedOrder && selectedOrder.id && (
                <div onClick={closeModal} className="fixed inset-0 flex items-center justify-center bg-black/50 text-slate-700 text-sm backdrop-blur-xs z-50" >
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4 text-center">
                            Order Details
                        </h2>

                        {/* Customer Details */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Customer Details</h3>
                            <p><span className="text-green-700">Name:</span> {selectedOrder.user?.name}</p>
                            <p><span className="text-green-700">Email:</span> {selectedOrder.user?.email}</p>
                            <p><span className="text-green-700">Phone:</span> {selectedOrder.address?.phone}</p>
                            <p><span className="text-green-700">Address:</span> {`${selectedOrder.address?.street}, ${selectedOrder.address?.city}, ${selectedOrder.address?.state}, ${selectedOrder.address?.zip}, ${selectedOrder.address?.country}`}</p>
                        </div>

                        {/* Products */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Products</h3>
                            <div className="space-y-2">
                                {selectedOrder && Array.isArray(selectedOrder.orderItems) && selectedOrder.orderItems.length > 0 ? (
                                    selectedOrder.orderItems.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 border border-slate-100 shadow rounded p-2">
                                            <img
                                                src={item.product?.images?.[0]?.src || item.product?.images?.[0] || '/placeholder.png'}
                                                alt={item.product?.name || 'Product'}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <p className="text-slate-800">{item.product?.name || 'Unknown Product'}</p>
                                                <p>Qty: {item.quantity}</p>
                                                <p>Price: ₹{item.price}</p>
                                                <p>Size: {item.selectedSize}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No products found for this order</p>
                                )}
                            </div>
                        </div>

                        {/* Payment & Status */}
                        <div className="mb-4">
                            <p><span className="text-green-700">Payment Method:</span> {selectedOrder.paymentMethod}</p>
                            <p><span className="text-green-700">Paid:</span> {selectedOrder.isPaid ? "Yes" : "No"}</p>
                            {selectedOrder.isCouponUsed && (
                                <p><span className="text-green-700">Coupon:</span> {selectedOrder.coupon.code} ({selectedOrder.coupon.discount}% off)</p>
                            )}
                            <p><span className="text-green-700">Status:</span> {selectedOrder.status}</p>
                            <p><span className="text-green-700">Order Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                        </div>

                        {/* Tracking Information */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <TruckIcon className="w-5 h-5" />
                                Tracking Information
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tracking Number
                                    </label>
                                    <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter tracking number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tracking URL
                                    </label>
                                    <input
                                        type="url"
                                        value={trackingUrl}
                                        onChange={(e) => setTrackingUrl(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://tracking.example.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Location
                                    </label>
                                    <input
                                        type="text"
                                        value={currentLocation}
                                        onChange={(e) => setCurrentLocation(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Current location of the package"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estimated Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        value={estimatedDelivery}
                                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={updateTrackingInfo}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Update Tracking Information
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end">
                            <button onClick={closeModal} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300" >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
