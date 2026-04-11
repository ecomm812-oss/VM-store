'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

export default function CreateStore() {

    const router = useRouter()
    const { user, isLoaded, isSignedIn } = useUser()
    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [status, setStatus] = useState("")
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")

    const [storeInfo, setStoreInfo] = useState({
        name: "",
        username: "",
        description: "",
        email: "",
        contact: "",
        address: "",
        logo: null,
        logoPreview: null
    })

    const onChangeHandler = (e) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
    }

    const handleLogoChange = async (e) => {
        const file = e.target.files[0]
        if (file) {
            // Create preview URL
            const previewUrl = URL.createObjectURL(file)
            setStoreInfo({ ...storeInfo, logo: file, logoPreview: previewUrl })
        }
    }

    const fetchSellerStatus = async () => {
        if (!user) return
        
        try {
            const response = await fetch('/api/store/info', {
                method: 'GET',
                credentials: 'same-origin'
            })
            if (response.ok) {
                const store = await response.json()
                setAlreadySubmitted(true)
                setStatus(store.status)
                if (store.status === 'approved') {
                    setMessage('Your store has been approved! Redirecting to dashboard...')
                    setTimeout(() => router.push('/store'), 5000)
                } else if (store.status === 'pending') {
                    setMessage('Your store is pending approval. Please wait for admin verification.')
                } else {
                    setMessage('Your store application was rejected. Please try again.')
                }
            } else if (response.status !== 404) {
                const error = await response.json().catch(() => ({}))
                console.error('Failed to fetch store info:', response.status, error)
            }
        } catch (error) {
            console.error('Error fetching seller status:', error)
        } finally {
            setLoading(false)
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        
        if (!isLoaded) {
            toast.error('Checking your session. Please try again in a moment.')
            return
        }

        if (!isSignedIn || !user) {
            toast.error('Please login first')
            return
        }

        // Validate required fields
        if (!storeInfo.name || !storeInfo.username || !storeInfo.email || !storeInfo.contact) {
            toast.error('Please fill in all required fields')
            return
        }

        try {
            let logoUrl = 'https://via.placeholder.com/200' // Default logo

            // Upload logo if selected
            if (storeInfo.logo) {
                const formData = new FormData()
                formData.append('file', storeInfo.logo)

                try {
                    const uploadResponse = await fetch('/api/upload/image', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    })

                    if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json()
                        logoUrl = uploadData.url
                        console.log('Logo uploaded successfully:', logoUrl)
                    } else {
                        const errorData = await uploadResponse.json().catch(() => ({}))
                        
                        // Provide user-friendly error messages based on status code
                        let errorMessage
                        if (uploadResponse.status === 413) {
                            errorMessage = 'File is too large. Maximum file size is 5MB.'
                        } else if (uploadResponse.status === 400) {
                            errorMessage = errorData.error || 'Invalid file. Please use JPG, PNG, GIF, or WebP format.'
                        } else if (uploadResponse.status === 401) {
                            errorMessage = 'Session expired. Please sign in again and retry.'
                        } else {
                            errorMessage = errorData.error || errorData.details || `Upload failed with status ${uploadResponse.status}`
                        }
                        
                        console.error('Logo upload error:', errorMessage, errorData)
                        toast.error(`Upload failed: ${errorMessage}`)
                        return
                    }
                } catch (uploadError) {
                    console.error('Logo upload network error:', uploadError)
                    toast.error('Network error: Failed to upload logo. Check your connection and try again.')
                    return
                }
            }

            const storeData = {
                name: storeInfo.name,
                username: storeInfo.username,
                description: storeInfo.description,
                email: storeInfo.email,
                contact: storeInfo.contact,
                address: storeInfo.address,
                logo: logoUrl
            }

            const response = await fetch('/api/store/create', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(storeData)
            })

            if (response.ok) {
                const store = await response.json()
                toast.success('Store submitted for review!')
                setAlreadySubmitted(true)
                setStatus('pending')
                setMessage('Your store has been submitted for review. Please wait for admin verification.')
            } else {
                const error = await response.json()
                if (response.status === 401) {
                    toast.error('Session expired. Please sign in again and retry.')
                    return
                }
                toast.error(error.error || 'Failed to create store')
            }
        } catch (error) {
            toast.error('Error submitting store')
            console.error(error)
        }
    }

    useEffect(() => {
        if (user) {
            fetchSellerStatus()
        } else {
            setLoading(false)
        }
    }, [user])

    return !loading ? (
        <>
            {!alreadySubmitted ? (
                <div className="mx-6 min-h-[70vh] my-16">
                    <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Submitting data..." })} className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500">
                        {/* Title */}
                        <div>
                            <h1 className="text-3xl ">Add Your <span className="text-slate-800 font-medium">Store</span></h1>
                            <p className="max-w-lg">To become a seller on VM Cart, submit your store details for review. Your store will be activated after admin verification.</p>
                        </div>

                        <label className="mt-10 cursor-pointer">
                            Store Logo
                            <div className="mt-2">
                                {storeInfo.logoPreview ? (
                                    <Image src={storeInfo.logoPreview} className="rounded-lg h-32 w-32 object-cover" alt="Logo preview" width={128} height={128} />
                                ) : (
                                    <Image src={assets.upload_area} className="rounded-lg h-16 w-auto" alt="" width={150} height={100} />
                                )}
                            </div>
                            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                        </label>

                        <p>Username</p>
                        <input name="username" onChange={onChangeHandler} value={storeInfo.username} type="text" placeholder="Enter your store username" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded" />

                        <p>Name</p>
                        <input name="name" onChange={onChangeHandler} value={storeInfo.name} type="text" placeholder="Enter your store name" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded" />

                        <p>Description</p>
                        <textarea name="description" onChange={onChangeHandler} value={storeInfo.description} rows={5} placeholder="Enter your store description" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none" />

                        <p>Email</p>
                        <input name="email" onChange={onChangeHandler} value={storeInfo.email} type="email" placeholder="Enter your store email" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded" />

                        <p>Contact Number</p>
                        <input name="contact" onChange={onChangeHandler} value={storeInfo.contact} type="text" placeholder="Enter your store contact number" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded" />

                        <p>Address</p>
                        <textarea name="address" onChange={onChangeHandler} value={storeInfo.address} rows={5} placeholder="Enter your store address" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none" />

                        <button className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition ">Submit</button>
                    </form>
                </div>
            ) : (
                <div className="min-h-[80vh] flex flex-col items-center justify-center">
                    <p className="sm:text-2xl lg:text-3xl mx-5 font-semibold text-slate-500 text-center max-w-2xl">{message}</p>
                    {status === "approved" && <p className="mt-5 text-slate-400">redirecting to dashboard in <span className="font-semibold">5 seconds</span></p>}
                </div>
            )}
        </>
    ) : (<Loading />)
}