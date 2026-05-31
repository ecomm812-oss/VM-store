import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { productDummyData } from '@/assets/assets'

const isDevelopment = process.env.NODE_ENV !== 'production'
const PRODUCT_LIST_TTL_MS = 60 * 1000

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
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                console.error(`[Redux] Products API returned ${response.status}:`, errorData)
                throw new Error(errorData?.error || `Failed to fetch products (${response.status})`)
            }

            const data = await response.json()

            if (!Array.isArray(data)) {
                console.error('[Redux] Products API returned non-array data:', typeof data, data)
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
            
            // Log if any products were filtered out
            if (validProducts.length < data.length) {
                console.warn(`[Redux] Filtered out ${data.length - validProducts.length} invalid products from API response`)
            }

            // If we got valid products, return them
            if (validProducts.length > 0) {
                console.log(`[Redux] Successfully fetched ${validProducts.length} products`)
                return validProducts
            }

            // If no valid products but data was received, log and fallback
            if (data.length > 0) {
                console.warn('[Redux] API returned products but all were invalid, using fallback')
                return normalizeFallbackProducts(productDummyData)
            }

            // If API returned empty array
            if (isDevelopment) {
                console.warn('[Redux] API returned empty product list in development, using fallback')
                return normalizeFallbackProducts(productDummyData)
            }

            // In production, return empty array
            return []
        } catch (error) {
            console.error('[Redux] Product fetch error:', error?.message || error)
            if (isDevelopment) {
                console.warn('[Redux] Falling back to local dummy products due to fetch failure')
                return normalizeFallbackProducts(productDummyData)
            }
            return rejectWithValue(error?.message || 'Failed to fetch products')
        }
    },
    {
        condition: (arg, { getState }) => {
            if (arg?.force) return true

            const state = getState()?.product
            if (!state) return true
            if (state.loading) return false

            const hasProducts = Array.isArray(state.list) && state.list.length > 0
            const isFresh = Date.now() - (state.lastFetchedAt || 0) < PRODUCT_LIST_TTL_MS

            if (hasProducts && isFresh) {
                console.log('[Redux] Using cached products')
                return false
            }

            return true
        }
    }
)

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        loading: false,
        error: null,
        lastFetchedAt: 0,
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
                state.lastFetchedAt = Date.now()
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    }
})

export const { setProduct, clearProduct } = productSlice.actions

export default productSlice.reducer