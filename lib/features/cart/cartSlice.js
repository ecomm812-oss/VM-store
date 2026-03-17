import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId, selectedSize = 'One Size' } = action.payload
            const key = `${productId}-${selectedSize}`
            if (state.cartItems[key]) {
                state.cartItems[key]++
            } else {
                state.cartItems[key] = 1
            }
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId, selectedSize = 'One Size' } = action.payload
            const key = `${productId}-${selectedSize}`
            if (state.cartItems[key]) {
                state.cartItems[key]--
                if (state.cartItems[key] === 0) {
                    delete state.cartItems[key]
                }
            }
            state.total -= 1
        },
        deleteItemFromCart: (state, action) => {
            const { productId, selectedSize = 'One Size' } = action.payload
            const key = `${productId}-${selectedSize}`
            state.total -= state.cartItems[key] ? state.cartItems[key] : 0
            delete state.cartItems[key]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer
