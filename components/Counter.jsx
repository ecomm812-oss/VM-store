'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ productId, selectedSize = 'One Size' }) => {

    const { cartItems } = useSelector(state => state.cart);

    const dispatch = useDispatch();

    const addToCartHandler = () => {
        dispatch(addToCart({ productId, selectedSize }))
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ productId, selectedSize }))
    }

    const key = `${productId}-${selectedSize}`

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600 transition-all duration-300 hover:border-green-500 hover:shadow-md">
            <button onClick={removeFromCartHandler} className="p-1 select-none transition-all duration-300 hover:scale-125 hover:text-red-500 active:scale-95">-</button>
            <p className="p-1 font-medium animate-fadeIn">{cartItems[key]}</p>
            <button onClick={addToCartHandler} className="p-1 select-none transition-all duration-300 hover:scale-125 hover:text-green-500 active:scale-95">+</button>
        </div>
    )
}

export default Counter