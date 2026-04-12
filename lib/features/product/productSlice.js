import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { productDummyData } from '@/assets/assets'

const isDevelopment = process.env.NODE_ENV !== 'production'

function toImageSrc(value) {
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
        if (typeof value.src === 'string') return value.src
        if (typeof value.default === 'string') return value.default
        if (value.default && typeof value.default.src === 'string') return value.default.src
    }
    return null
}

function normalizeFallbackProducts(products) {
    return products
        .map(product => ({
            ...product,
            images: Array.isArray(product.images) ? product.images.map(toImageSrc).filter(Boolean) : [],
            store: product.store ? {
                ...product.store,
                logo: toImageSrc(product.store.logo),
                user: product.store.user ? {
                    ...product.store.user,
                    image: toImageSrc(product.store.user.image)
                } : null
            } : null,
            rating: Array.isArray(product.rating)
                ? product.rating.map(entry => ({
                    ...entry,
                    user: entry.user ? {
                        ...entry.user,
                        image: toImageSrc(entry.user.image)
                    } : null
                }))
                : []
        }))
        .filter(product => product.images.length > 0)
}

export const fetchProducts = createAsyncThunk(
    'product/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/products')
            const data = await response.json()

            if (!response.ok) {
                if (isDevelopment) {
                    console.warn('Products API failed in development, using client fallback products')
                    return normalizeFallbackProducts(productDummyData)
                }
                throw new Error(data?.error || 'Failed to fetch products')
            }

            if (!Array.isArray(data)) {
                if (isDevelopment) {
                    console.warn('Products API returned unexpected payload in development, using fallback products')
                    return normalizeFallbackProducts(productDummyData)
                }
                throw new Error('Invalid product data received from API')
            }
            
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
            if (isDevelopment) {
                console.warn('Product fetch failed in development, using fallback products:', error)
                return normalizeFallbackProducts(productDummyData)
            }
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