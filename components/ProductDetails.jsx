'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon, TruckIcon, RotateCcwIcon, CalendarDaysIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";

const ProductDetails = ({ product }) => {

    if (!product || !product.id || !product.name) {
        console.error('[ProductDetails] Product is missing required fields:', product)
        return (
            <div className="text-center py-8">
                <p className="text-red-500">Invalid product data</p>
            </div>
        )
    }

    const productId = product.id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';

    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();

    const router = useRouter()

    // Safe access to images - ensure it's an array
    const images = Array.isArray(product.images) ? product.images.filter(Boolean) : []
    const [mainImage, setMainImage] = useState(images?.[0] || '/placeholder.png');

    const [selectedSize, setSelectedSize] = useState(product?.category === 'Clothing' ? 'M' : 'One Size');

    const availableSizes = product?.category === 'Clothing' ? ['XS', 'S', 'M', 'L', 'XL', 'XXL'] : [];

    const addToCartHandler = () => {
        dispatch(addToCart({ productId, selectedSize }))
    }

    // Safe rating calculation - ensure rating is an array
    const rating = Array.isArray(product.rating) ? product.rating : []
    const averageRating = (rating.length > 0)
        ? rating.reduce((acc, item) => acc + (item.rating || 0), 0) / rating.length
        : 0;

    const deliveryDays = Number(product?.deliveryDays) || 5;
    const defaultDeliveryDate = new Date();
    defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + deliveryDays);
    const estimatedDeliveryDate = product?.estimatedDelivery
        ? new Date(product.estimatedDelivery)
        : defaultDeliveryDate;
    const deliveryCharge = typeof product?.deliveryCharge === 'number'
        ? product.deliveryCharge
        : (Number(product?.price) >= 499 ? 0 : 49);
    const returnPolicy = product?.returnPolicy || 'Easy 7-day returns if the product is unused and packed in its original condition.';
    const deliveryLabel = deliveryCharge === 0 ? 'Free delivery' : `${currency}${deliveryCharge} delivery charge`;
    const formattedDeliveryDate = Number.isNaN(estimatedDeliveryDate.getTime())
        ? `in ${deliveryDays} business days`
        : estimatedDeliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    return (
        <div className="flex max-lg:flex-col gap-12">
            <div className="flex max-sm:flex-col-reverse gap-3">
                <div className="flex sm:flex-col gap-3">
                    {images.length > 0 && images.map((image, index) => (
                        <div key={index} onClick={() => setMainImage(images[index])} className="bg-slate-100 flex items-center justify-center size-26 rounded-lg group cursor-pointer">
                            <Image src={image} className="group-hover:scale-103 group-active:scale-95 transition" alt="" width={45} height={45} />
                        </div>
                    ))}
                </div>
                <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg ">
                    <Image src={mainImage} alt="" width={250} height={250} />
                </div>
            </div>
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>
                <div className='flex items-center mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                    ))}
                    <p className="text-sm ml-3 text-slate-500">{rating.length || 0} Reviews</p>
                </div>
                <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800">
                    <p> {currency}{product.price} </p>
                    <p className="text-xl text-slate-500 line-through">{currency}{product.mrp}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <TagIcon size={14} />
                    <p>Save {((product.mrp - product.price) / product.mrp * 100).toFixed(0)}% right now</p>
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                            <TruckIcon size={16} className="mt-0.5 text-slate-500" />
                            <div>
                                <p className="font-semibold text-slate-800">Delivery</p>
                                <p>{deliveryLabel}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                            <CalendarDaysIcon size={16} className="mt-0.5 text-slate-500" />
                            <div>
                                <p className="font-semibold text-slate-800">Delivered by</p>
                                <p>{formattedDeliveryDate}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                            <RotateCcwIcon size={16} className="mt-0.5 text-slate-500" />
                            <div>
                                <p className="font-semibold text-slate-800">Return policy</p>
                                <p>{returnPolicy}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-end gap-5 mt-10">
                    {availableSizes.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <p className="text-lg text-slate-800 font-semibold">Size</p>
                            <div className="flex gap-2">
                                {availableSizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-4 py-2 border rounded ${selectedSize === size ? 'bg-slate-800 text-white' : 'bg-white text-slate-800 hover:bg-slate-100'}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {
                        cart[`${productId}-${selectedSize}`] && (
                            <div className="flex flex-col gap-3">
                                <p className="text-lg text-slate-800 font-semibold">Quantity</p>
                                <Counter productId={productId} selectedSize={selectedSize} />
                            </div>
                        )
                    }
                    <button onClick={() => !cart[`${productId}-${selectedSize}`] ? addToCartHandler() : router.push('/cart')} className="bg-slate-800 text-white px-10 py-3 text-sm font-medium rounded hover:bg-slate-900 active:scale-95 transition">
                        {!cart[`${productId}-${selectedSize}`] ? 'Add to Cart' : 'View Cart'}
                    </button>
                </div>
                <hr className="border-gray-300 my-5" />
                <div className="flex flex-col gap-4 text-slate-500">
                    <p className="flex gap-3"> <EarthIcon className="text-slate-400" /> Free shipping worldwide </p>
                    <p className="flex gap-3"> <CreditCardIcon className="text-slate-400" /> 100% Secured Payment </p>
                    <p className="flex gap-3"> <UserIcon className="text-slate-400" /> Trusted by top brands </p>
                </div>

            </div>
        </div>
    )
}

export default ProductDetails