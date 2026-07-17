'use client'

import Loading from '@/components/Loading'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function AdminProductsPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/admin/products')
            if (!response.ok) {
                throw new Error('Failed to fetch products')
            }

            const data = await response.json()
            setProducts(data)
        } catch (error) {
            console.error('Failed to load products:', error)
            toast.error('Unable to load products')
        } finally {
            setLoading(false)
        }
    }

    const toggleStock = async (productId, currentValue) => {
        try {
            const response = await fetch('/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, inStock: !currentValue })
            })

            if (!response.ok) {
                throw new Error('Failed to update product')
            }

            const updatedProduct = await response.json()
            setProducts(products.map(product =>
                product.id === productId ? { ...product, inStock: updatedProduct.inStock } : product
            ))
            toast.success('Product availability updated')
        } catch (error) {
            console.error('Failed to update product:', error)
            toast.error('Unable to update product')
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500">
            <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl">Manage <span className="text-slate-800 font-medium">All Products</span></h1>
                    <p className="text-sm text-slate-500 mt-1">Review every product and update availability from one place.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{products.length} products</span>
            </div>

            {products.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-slate-600">
                    <p className="text-lg font-medium text-slate-800">No products found.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                            <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">Store</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-t border-slate-200 hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-slate-800">{product.name}</p>
                                            <p className="text-xs text-slate-500">{product.category}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-slate-700">{product.store?.name || 'Unknown store'}</p>
                                            <p className="text-xs text-slate-500">@{product.store?.username || 'unknown'}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">₹{Number(product.price || 0).toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {product.inStock ? 'In stock' : 'Out of stock'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => toggleStock(product.id, product.inStock)}
                                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${product.inStock ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                                        >
                                            {product.inStock ? 'Mark out of stock' : 'Mark in stock'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
