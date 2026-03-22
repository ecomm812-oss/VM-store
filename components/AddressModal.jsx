'use client'
import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"
import { addAddress } from "@/lib/features/address/addressSlice"

const AddressModal = ({ setShowAddressModal }) => {

    const dispatch = useDispatch()

    const [address, setAddress] = useState({
        name: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: ''
    })

    const handleAddressChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const response = await fetch('/api/user/address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(address)
            })

            if (response.ok) {
                const newAddress = await response.json()
                // Dispatch the address to Redux store
                dispatch(addAddress(newAddress))
                toast.success('Address added successfully!')
                setShowAddressModal(false)
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to add address')
            }
        } catch (error) {
            toast.error(error.message || 'Failed to add address')
        }
    }

    return (
        <form onSubmit={e => toast.promise(handleSubmit(e), { loading: 'Adding Address...' })} className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center animate-fadeIn">
            <div className="flex flex-col gap-5 text-slate-700 w-full max-w-sm mx-6 animate-scaleIn">
                <h2 className="text-3xl animate-slideInDown">Add New <span className="font-semibold">Address</span></h2>
                <input name="name" onChange={handleAddressChange} value={address.name} className="p-2 px-4 outline-none border border-slate-200 rounded w-full transition-all duration-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 animate-slideInUp" type="text" placeholder="Enter your name" required />
                <input name="email" onChange={handleAddressChange} value={address.email} className="p-2 px-4 outline-none border border-slate-200 rounded w-full transition-all duration-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 animate-slideInUp" style={{ animationDelay: '0.05s' }} type="email" placeholder="Email address" required />
                <input name="street" onChange={handleAddressChange} value={address.street} className="p-2 px-4 outline-none border border-slate-200 rounded w-full transition-all duration-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 animate-slideInUp" style={{ animationDelay: '0.1s' }} type="text" placeholder="Street" required />
                <div className="flex gap-4">
                    <input name="city" onChange={handleAddressChange} value={address.city} className="p-2 px-4 outline-none border border-slate-200 rounded w-full transition-all duration-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 animate-slideInUp" style={{ animationDelay: '0.15s' }} type="text" placeholder="City" required />
                    <input name="state" onChange={handleAddressChange} value={address.state} className="p-2 px-4 outline-none border border-slate-200 rounded w-full transition-all duration-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 animate-slideInUp" style={{ animationDelay: '0.15s' }} type="text" placeholder="State" required />
                </div>
                <div className="flex gap-4">
                    <input name="zip" onChange={handleAddressChange} value={address.zip} className="p-2 px-4 outline-none border border-slate-200 rounded w-full transition-all duration-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 animate-slideInUp" style={{ animationDelay: '0.2s' }} type="number" placeholder="Zip code" required />
                    <input name="country" onChange={handleAddressChange} value={address.country} className="p-2 px-4 outline-none border border-slate-200 rounded w-full transition-all duration-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 animate-slideInUp" style={{ animationDelay: '0.2s' }} type="text" placeholder="Country" required />
                </div>
                <input name="phone" onChange={handleAddressChange} value={address.phone} className="p-2 px-4 outline-none border border-slate-200 rounded w-full transition-all duration-300 focus:border-green-500 focus:ring-1 focus:ring-green-200 animate-slideInUp" style={{ animationDelay: '0.25s' }} type="text" placeholder="Phone" required />
                <button className="bg-slate-800 text-white text-sm font-medium py-2.5 rounded-md hover:bg-slate-900 active:scale-95 transition-all btn-primary hover:shadow-lg animate-slideInUp" style={{ animationDelay: '0.3s' }}>SAVE ADDRESS</button>
            </div>
            <XIcon size={30} className="absolute top-5 right-5 text-slate-500 hover:text-slate-700 cursor-pointer transition-all duration-300 hover:scale-125 hover:rotate-90" onClick={() => setShowAddressModal(false)} />
        </form>
    )
}

export default AddressModal