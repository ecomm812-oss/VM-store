'use client'
import { storesDummyData } from "@/assets/assets"
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function AdminStores() {

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchStores = async () => {
        try {
            const response = await fetch('/api/admin/stores')
            if (response.ok) {
                const data = await response.json()
                setStores(data)
            } else {
                // Fallback to dummy data
                setStores(storesDummyData)
            }
        } catch (error) {
            console.error('Failed to fetch stores:', error)
            setStores(storesDummyData)
        }
        setLoading(false)
    }

    const toggleIsActive = async (storeId) => {
        const currentStore = stores.find(store => store.id === storeId)
        if (!currentStore) return 'Store not found'

        const nextValue = !currentStore.isActive

        setStores(prevStores => prevStores.map(store =>
            store.id === storeId ? { ...store, isActive: nextValue } : store
        ))

        try {
            const response = await fetch('/api/admin/stores', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId, isActive: nextValue })
            })

            if (!response.ok) {
                throw new Error('Failed to update store status')
            }

            const updatedStore = await response.json()
            setStores(prevStores => prevStores.map(store =>
                store.id === storeId ? { ...store, isActive: updatedStore.isActive } : store
            ))
            return 'Store status updated successfully'
        } catch (error) {
            setStores(prevStores => prevStores.map(store =>
                store.id === storeId ? { ...store, isActive: currentStore.isActive } : store
            ))
            console.error('Error updating store:', error)
            throw error
        }
    }

    useEffect(() => {
        fetchStores()
    }, [])

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Live <span className="text-slate-800 font-medium">Stores</span></h1>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl" >
                            {/* Store Info */}
                            <StoreInfo store={store} />

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                <p>Active</p>
                                <label className="relative inline-flex items-center cursor-pointer text-gray-900">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        onChange={() => toast.promise(toggleIsActive(store.id), { loading: 'Updating data...', success: 'Store updated', error: 'Failed to update store' })}
                                        checked={Boolean(store.isActive)}
                                    />
                                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                    <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                </label>
                            </div>
                        </div>
                    ))}

                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No stores Available</h1>
                </div>
            )
            }
        </div>
    ) : <Loading />
}