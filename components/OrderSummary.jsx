import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import AddressModal from './AddressModal';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { addAddress } from '@/lib/features/address/addressSlice';

const OrderSummary = ({ totalPrice, items }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';

    const router = useRouter();
    const { user } = useUser();
    const dispatch = useDispatch();

    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch addresses from API on component mount
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await fetch('/api/user/address');
                if (response.ok) {
                    const addresses = await response.json();
                    // Update Redux store with fetched addresses
                    addresses.forEach(address => {
                        if (!addressList.find(a => a.id === address.id)) {
                            dispatch(addAddress(address));
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to fetch addresses:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAddresses();
        }
    }, [user, dispatch, addressList]);

    const handleCouponCode = async (event) => {
        event.preventDefault();
        
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('Please login to place order');
            return;
        }

        if (!selectedAddress) {
            toast.error('Please select an address');
            return;
        }

        const storeId = items[0]?.storeId; // Assuming all items from same store

        const orderData = {
            total: coupon ? (totalPrice - (coupon.discount / 100 * totalPrice)) : totalPrice,
            storeId,
            addressId: selectedAddress.id,
            paymentMethod,
            orderItems: items.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
                selectedSize: item.selectedSize || 'One Size'
            })),
            isCouponUsed: !!coupon,
            coupon: coupon || {}
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to place order');
            }

            const { order, razorpayOrder } = await response.json();

            if (paymentMethod === 'RAZORPAY' && razorpayOrder) {
                // Verify Razorpay key is available
                const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
                if (!razorpayKeyId) {
                    toast.error('Razorpay is not configured on this frontend. Please contact support.');
                    return;
                }

                // Check if Razorpay script is loaded
                if (!window.Razorpay) {
                    toast.error('Payment system not initialized. Please refresh the page.');
                    return;
                }

                // Open Razorpay checkout
                const options = {
                    key: razorpayKeyId,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    name: 'VM Cart',
                    description: 'Order Payment',
                    order_id: razorpayOrder.id,
                    handler: async function (response) {
                        // Payment successful - update order status in backend
                        try {
                            const updateResponse = await fetch('/api/orders', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    orderId: order.id,
                                    isPaid: true,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpaySignature: response.razorpay_signature
                                })
                            });

                            if (!updateResponse.ok) {
                                const error = await updateResponse.json();
                                throw new Error(error.error || 'Failed to update payment status');
                            }

                            toast.success('Payment successful!');
                            router.push('/orders');
                        } catch (updateError) {
                            console.error('Failed to update payment status:', updateError);
                            toast.error('Payment completed but status update failed. Please contact support.');
                            router.push('/orders');
                        }
                    },
                    modal: {
                        ondismiss: function() {
                            toast.error('Payment cancelled');
                        }
                    },
                    prefill: {
                        name: user.firstName + ' ' + user.lastName,
                        email: user.emailAddresses[0].emailAddress,
                    },
                    theme: {
                        color: '#374151',
                    },
                };
                
                try {
                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function (response) {
                        toast.error(`Payment failed: ${response.error.description}`);
                    });
                    rzp.open();
                } catch (error) {
                    toast.error('Failed to initialize payment. Please try again.');
                    console.error('Razorpay error:', error);
                }
            } else {
                // For COD or other methods
                toast.success('Order placed successfully!');
                router.push('/orders');
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>
            <p className='text-slate-400 text-xs my-4'>Payment Method</p>
            <div className='flex gap-2 items-center'>
                <input type="radio" id="COD" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                <label htmlFor="COD" className='cursor-pointer'>COD</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input type="radio" id="RAZORPAY" name='payment' onChange={() => setPaymentMethod('RAZORPAY')} checked={paymentMethod === 'RAZORPAY'} className='accent-gray-500' />
                <label htmlFor="RAZORPAY" className='cursor-pointer'>Razorpay Payment</label>
            </div>
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-center'>
                            <p>{selectedAddress.name}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
                            <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer' size={18} />
                        </div>
                    ) : (
                        <div>
                            {
                                addressList.length > 0 && (
                                    <select className='border border-slate-400 p-2 w-full my-3 outline-none rounded' onChange={(e) => setSelectedAddress(addressList[e.target.value])} >
                                        <option value="">Select Address</option>
                                        {
                                            addressList.map((address, index) => (
                                                <option key={index} value={index}>{address.name}, {address.city}, {address.state}, {address.zip}</option>
                                            ))
                                        }
                                    </select>
                                )
                            }
                            <button className='flex items-center gap-1 text-slate-600 mt-1' onClick={() => setShowAddressModal(true)} >Add Address <PlusIcon size={18} /></button>
                        </div>
                    )
                }
            </div>
            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Shipping:</p>
                        {coupon && <p>Coupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{currency}{totalPrice.toLocaleString()}</p>
                        <p>Free</p>
                        {coupon && <p>{`-${currency}${(coupon.discount / 100 * totalPrice).toFixed(2)}`}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...' })} className='flex justify-center gap-3 mt-3'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                            <button className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'>Apply</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.description}</p>
                            <XIcon size={18} onClick={() => setCoupon('')} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                <p>Total:</p>
                <p className='font-medium text-right'>{currency}{coupon ? (totalPrice - (coupon.discount / 100 * totalPrice)).toFixed(2) : totalPrice.toLocaleString()}</p>
            </div>
            <button onClick={e => toast.promise(handlePlaceOrder(e), { loading: 'placing Order...' })} className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'>Place Order</button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}

        </div>
    )
}

export default OrderSummary