'use client'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { fetchProducts } from '@/lib/features/product/productSlice'

export default function AppInitializer() {
    const dispatch = useDispatch()
    const productCount = useSelector(state => state.product.list.length)
    const lastFetchedAt = useSelector(state => state.product.lastFetchedAt)

    useEffect(() => {
        const isFresh = Date.now() - (lastFetchedAt || 0) < 60 * 1000
        if (productCount > 0 && isFresh) return

        dispatch(fetchProducts())
    }, [dispatch, productCount, lastFetchedAt])

    return null
}