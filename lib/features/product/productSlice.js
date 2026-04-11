import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchProducts = createAsyncThunk(
    'product/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/products')
            if (!response.ok) {
                throw new Error('Failed to fetch products')
            }
            const data = await response.json()
            
            // Keep filtering lightweight to avoid dropping valid backend records.
            const validProducts = data.filter(product => {
                return (
                    product &&
                    product.id &&
                    product.name &&
                    product.price !== undefined &&
                    product.images &&
                    Array.isArray(product.images) &&
                    product.images.length > 0
                )
            })
            
            // Log any invalid products for debugging
            if (validProducts.length < data.length) {
                console.warn(`Filtered out ${data.length - validProducts.length} invalid products from API response`)
            }
            
            return validProducts
        } catch (error) {
            return rejectWithValue(error.message)
        }
    }
)

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        loading: false,
        error: null,
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload
        },
        clearProduct: (state) => {
            state.list = []
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    }
})

export const { setProduct, clearProduct } = productSlice.actions

export default productSlice.reducer