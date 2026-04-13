'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import Link from "next/link"

export default function StoreManageProducts() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [errorMessage, setErrorMessage] = useState('')

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products/store', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            const data = await response.json().catch(() => null)

            if (response.ok) {
                if (!Array.isArray(data)) {
                    throw new Error('Invalid products response received from the server')
                }

                setProducts(data)
                setErrorMessage('')
            } else {
                const message = data?.error || data?.details || 'Failed to fetch products'
                setErrorMessage(message)
                toast.error(message)
            }
        } catch (error) {
            const message = error?.message || 'Failed to fetch products'
            setErrorMessage(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const toggleStock = async (productId) => {
        const product = products.find(p => p.id === productId)
        if (!product) throw new Error('Product not found')

        const response = await fetch('/api/products/store', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: productId,
                inStock: !product.inStock
            })
        })

        if (response.ok) {
            const updatedProduct = await response.json()
            setProducts(products.map(p => p.id === productId ? { ...p, ...updatedProduct } : p))
            return updatedProduct
        } else {
            try {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update product stock')
            } catch (parseError) {
                if (parseError.message && parseError.message.includes('Failed to update')) {
                    throw parseError
                }
                throw new Error('Failed to update product stock')
            }
        }
    }

    useEffect(() => {
            fetchProducts()
    }, [])

    if (loading) return <Loading />

    if (errorMessage) {
        return (
            <div className="max-w-4xl">
                <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                    <p className="font-medium">Unable to load your products.</p>
                    <p className="mt-2 text-sm">{errorMessage}</p>
                </div>
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <div className="max-w-4xl">
                <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-slate-600">
                    <p className="text-lg font-medium text-slate-800">No products found yet.</p>
                    <p className="mt-2 text-sm">Add your first product to make it appear in your store and public catalog.</p>
                    <Link href="/store/add-product" className="inline-flex mt-5 rounded-lg bg-slate-800 px-5 py-2 text-sm font-medium text-white hover:bg-slate-900 transition">
                        Add New Product
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            <table className="w-full max-w-4xl text-left  ring ring-slate-200  rounded overflow-hidden text-sm">
                <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 hidden md:table-cell">Description</th>
                        <th className="px-4 py-3 hidden md:table-cell">MRP</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700">
                    {products.map((product) => (
                        <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <div className="flex gap-2 items-center">
                                    <Image width={40} height={40} className='p-1 shadow rounded cursor-pointer' src={product.images[0]} alt="" />
                                    {product.name}
                                </div>
                            </td>
                            <td className="px-4 py-3 max-w-md text-slate-600 hidden md:table-cell truncate">{product.description}</td>
                            <td className="px-4 py-3 hidden md:table-cell">{currency} {product.mrp.toLocaleString()}</td>
                            <td className="px-4 py-3">{currency} {product.price.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                                <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                    <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating stock...", success: "Stock updated!", error: "Failed to update stock" })} checked={product.inStock} />
                                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                    <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                </label>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}