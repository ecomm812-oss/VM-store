'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { uploadImageFile, validateImageFile } from "@/lib/upload-client"

const isClerkConfigured = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '').startsWith('pk_')

export default function CreateStore() {
    return isClerkConfigured ? <CreateStoreWithClerk /> : <CreateStoreDevMode />
}

function CreateStoreWithClerk() {

    const router = useRouter()
    const { user, isLoaded, isSignedIn } = useUser()
    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [status, setStatus] = useState("")
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)

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
            const validationError = validateImageFile(file)
            if (validationError) {
                toast.error(validationError)
                return
            }

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

        setSubmitting(true)

        try {
            let logoUrl = 'https://via.placeholder.com/200' // Default logo

            if (storeInfo.logo) {
                try {
                    const uploadData = await uploadImageFile(storeInfo.logo)
                    logoUrl = uploadData.url
                    console.log('Logo uploaded successfully:', logoUrl)
                } catch (uploadError) {
                    console.error('Logo upload network error:', uploadError)
                    console.warn('Continuing with default logo after upload failure')
                    logoUrl = 'https://via.placeholder.com/200'
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
                const error = await response.json().catch(() => ({}))
                if (response.status === 401) {
                    throw new Error(error.error || 'Your session is no longer valid. Please sign in again.')
                }
                throw new Error(error.error || error.details || 'Failed to create store')
            }
        } catch (error) {
            console.error(error)
            const errorMessage = error?.message || 'Error submitting store'
            toast.error(errorMessage)
            if (errorMessage.toLowerCase().includes('sign in')) {
                router.push('/sign-in?redirect_url=/create-store')
            }
        } finally {
            setSubmitting(false)
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
                    <form onSubmit={onSubmitHandler} className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500">
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

                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
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

function CreateStoreDevMode() {
    const router = useRouter()
    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [status, setStatus] = useState("")
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [storeInfo, setStoreInfo] = useState({
        name: "",
        username: "",
        description: "",
        email: "dev@example.com",
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
            const validationError = validateImageFile(file)
            if (validationError) {
                toast.error(validationError)
                return
            }

            const previewUrl = URL.createObjectURL(file)
            setStoreInfo({ ...storeInfo, logo: file, logoPreview: previewUrl })
        }
    }

    const fetchSellerStatus = async () => {
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
            }
        } catch (error) {
            console.error('Error fetching seller status:', error)
        } finally {
            setLoading(false)
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()

        if (!storeInfo.name || !storeInfo.username || !storeInfo.email || !storeInfo.contact) {
            toast.error('Please fill in all required fields')
            return
        }

        setSubmitting(true)

        try {
            let logoUrl = 'https://via.placeholder.com/200'

            if (storeInfo.logo) {
                try {
                    const uploadData = await uploadImageFile(storeInfo.logo)
                    logoUrl = uploadData.url
                } catch (uploadError) {
                    console.error('Logo upload network error:', uploadError)
                    console.warn('Continuing with default logo after upload failure')
                    logoUrl = 'https://via.placeholder.com/200'
                }
            }

            const response = await fetch('/api/store/create', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: storeInfo.name,
                    username: storeInfo.username,
                    description: storeInfo.description,
                    email: storeInfo.email,
                    contact: storeInfo.contact,
                    address: storeInfo.address,
                    logo: logoUrl
                })
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new Error(error.error || error.details || 'Failed to create store')
            }

            toast.success('Store submitted for review!')
            setAlreadySubmitted(true)
            setStatus('pending')
            setMessage('Your store has been submitted for review. Please wait for admin verification.')
        } catch (error) {
            console.error(error)
            toast.error(error?.message || 'Error submitting store')
        } finally {
            setSubmitting(false)
        }
    }

    useEffect(() => {
        fetchSellerStatus()
    }, [])

    return !loading ? (
        <>
            {!alreadySubmitted ? (
                <div className="mx-6 min-h-[70vh] my-16">
                    <form onSubmit={onSubmitHandler} className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500">
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

                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
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