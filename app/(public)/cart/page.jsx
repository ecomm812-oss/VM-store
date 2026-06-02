'use client'
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export const dynamic = 'force-dynamic';

const isClerkConfigured = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '').startsWith('pk_');

export default function Cart() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
    
    const { cartItems } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);
    const productLoading = useSelector(state => state.product.loading);

    const dispatch = useDispatch();

    const [cartArray, setCartArray] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [missingProducts, setMissingProducts] = useState({});
    const [missingFetchPending, setMissingFetchPending] = useState(false);

    const createCartArray = () => {
        let total = 0;
        const cartArray = [];
        for (const [key, value] of Object.entries(cartItems)) {
            // Split from the end to handle hyphens in keys
            const lastHyphenIndex = key.lastIndexOf('-');
            if (lastHyphenIndex === -1) continue;
            
            const productId = key.substring(0, lastHyphenIndex);
            const selectedSize = key.substring(lastHyphenIndex + 1) || 'One Size';
            
            const product = products.find(product => product.id === productId) || missingProducts[productId];
            if (product) {
                cartArray.push({
                    ...product,
                    storeId: product.storeId || product.store?.id,
                    quantity: value,
                    selectedSize: selectedSize,
                });
                total += product.price * value;
            }
        }
        setCartArray(cartArray);
        setTotalPrice(total);
    }

    const handleDeleteItemFromCart = (productId, selectedSize) => {
        dispatch(deleteItemFromCart({ productId, selectedSize }))
    }

    useEffect(() => {
        if (Object.keys(cartItems).length > 0 && products.length === 0 && !productLoading) {
            dispatch(fetchProducts())
        }
    }, [cartItems, products.length, productLoading, dispatch])

    useEffect(() => {
        const missingIds = Object.entries(cartItems).reduce((ids, [key]) => {
            const lastHyphenIndex = key.lastIndexOf('-')
            if (lastHyphenIndex === -1) return ids

            const productId = key.substring(0, lastHyphenIndex)
            if (!products.some(product => product.id === productId) && !missingProducts[productId]) {
                ids.add(productId)
            }
            return ids
        }, new Set())

        if (missingIds.size === 0) {
            return
        }

        const fetchMissingProducts = async () => {
            setMissingFetchPending(true)
            const fetched = {}

            await Promise.all([...missingIds].map(async (productId) => {
                try {
                    const response = await fetch(`/api/products?productId=${encodeURIComponent(productId)}`)
                    if (!response.ok) return
                    const product = await response.json()
                    if (product?.id) {
                        fetched[productId] = product
                    }
                } catch (error) {
                    // Ignore individual failures; the cart will still update if other products resolve.
                }
            }))

            if (Object.keys(fetched).length > 0) {
                setMissingProducts(prev => ({ ...prev, ...fetched }))
            }

            setMissingFetchPending(false)
        }

        fetchMissingProducts()
    }, [cartItems, products, missingProducts])

    useEffect(() => {
        createCartArray();
    }, [cartItems, products, missingProducts]);

    const hasCartItems = Object.keys(cartItems).length > 0
    const isLoadingCart = hasCartItems && cartArray.length === 0 && (productLoading || missingFetchPending)

    return isLoadingCart ? (
        <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
            <h1 className="text-2xl sm:text-4xl font-semibold">Loading your cart...</h1>
        </div>
    ) : cartArray.length > 0 ? (
        <div className="min-h-screen mx-6 text-slate-800">

            <div className="max-w-7xl mx-auto ">
                {/* Title */}
                <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />

                <div className="flex items-start justify-between gap-5 max-lg:flex-col">

                    <table className="w-full max-w-4xl text-slate-600 table-auto">
                        <thead>
                            <tr className="max-sm:text-sm">
                                <th className="text-left">Product</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th className="max-md:hidden">Remove</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                cartArray.map((item, index) => (
                                    <tr key={index} className="space-x-2">
                                        <td className="flex gap-3 my-4">
                                            <div className="flex gap-3 items-center justify-center bg-slate-100 size-18 rounded-md">
                                                <Image src={item.images?.[0] || '/placeholder.png'} className="h-14 w-auto" alt="" width={45} height={45} />
                                            </div>
                                            <div>
                                                <p className="max-sm:text-sm">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.category}</p>
                                                <p className="text-xs text-slate-500">Size: {item.selectedSize}</p>
                                                <p>{currency}{item.price}</p>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <Counter productId={item.id} selectedSize={item.selectedSize} />
                                        </td>
                                        <td className="text-center">{currency}{(item.price * item.quantity).toLocaleString()}</td>
                                        <td className="text-center max-md:hidden">
                                            <button onClick={() => handleDeleteItemFromCart(item.id, item.selectedSize)} className=" text-red-500 hover:bg-red-50 p-2.5 rounded-full active:scale-95 transition-all">
                                                <Trash2Icon size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                    {isClerkConfigured ? (
                        <OrderSummary totalPrice={totalPrice} items={cartArray} />
                    ) : (
                        <div className="w-full max-w-lg lg:max-w-85 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-7">
                            <h2 className="text-xl font-medium text-amber-900">Checkout unavailable</h2>
                            <p className="mt-3">
                                Authentication is not configured for this environment. Add valid Clerk keys in .env.local to enable checkout.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
            <h1 className="text-2xl sm:text-4xl font-semibold">Your cart is empty</h1>
        </div>
    )
}