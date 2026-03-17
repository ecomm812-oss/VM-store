'use client'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchProducts } from '@/lib/features/product/productSlice'

export default function AppInitializer() {
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(fetchProducts())
    }, [dispatch])

    return null
}