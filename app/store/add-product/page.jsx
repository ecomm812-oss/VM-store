'use client'
import { useState, useRef } from "react"
import { toast } from "react-hot-toast"
import { UploadIcon, XIcon } from "lucide-react"

export default function StoreAddProduct() {

    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']

    const [images, setImages] = useState(['', '', '', ''])
    const [uploadedFiles, setUploadedFiles] = useState([null, null, null, null])
    const [dragOver, setDragOver] = useState([false, false, false, false])
    const [uploading, setUploading] = useState([false, false, false, false])
    const fileInputRefs = [useRef(), useRef(), useRef(), useRef()]
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
    })
    const [loading, setLoading] = useState(false)


    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    const onImageChange = (index, value) => {
        const newImages = [...images]
        newImages[index] = value
        setImages(newImages)
    }

    const handleFileUpload = async (index, file) => {
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        setUploading(prev => {
            const newUploading = [...prev]
            newUploading[index] = true
            return newUploading
        })

        try {
            // Create FormData for file upload
            const formData = new FormData()
            formData.append('file', file)

            // Upload to our API endpoint
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                const newImages = [...images]
                newImages[index] = data.url
                setImages(newImages)

                const newUploadedFiles = [...uploadedFiles]
                newUploadedFiles[index] = data.url
                setUploadedFiles(newUploadedFiles)

                toast.success('Image uploaded successfully!')
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Upload failed')
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload image. Please try again.')
        } finally {
            setUploading(prev => {
                const newUploading = [...prev]
                newUploading[index] = false
                return newUploading
            })
        }
    }

    const handleDragOver = (e, index) => {
        e.preventDefault()
        const newDragOver = [...dragOver]
        newDragOver[index] = true
        setDragOver(newDragOver)
    }

    const handleDragLeave = (e, index) => {
        e.preventDefault()
        const newDragOver = [...dragOver]
        newDragOver[index] = false
        setDragOver(newDragOver)
    }

    const handleDrop = (e, index) => {
        e.preventDefault()
        const newDragOver = [...dragOver]
        newDragOver[index] = false
        setDragOver(newDragOver)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFileUpload(index, files[0])
        }
    }

    const removeImage = (index) => {
        const newImages = [...images]
        newImages[index] = ''
        setImages(newImages)

        const newUploadedFiles = [...uploadedFiles]
        newUploadedFiles[index] = null
        setUploadedFiles(newUploadedFiles)
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        
        // Validate that at least one image is provided
        const hasImages = images.some(img => img.trim() !== '') || uploadedFiles.some(file => file !== null)
        if (!hasImages) {
            throw new Error('Please upload at least one image or enter an image URL')
        }
        
        setLoading(true)
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...productInfo,
                    images: images.filter(img => img.trim() !== '')
                })
            })
            if (response.ok) {
                const product = await response.json()
                setProductInfo({
                    name: "",
                    description: "",
                    mrp: 0,
                    price: 0,
                    category: "",
                })
                setImages(['', '', '', ''])
                setUploadedFiles([null, null, null, null])
                return product // Return for toast.promise
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to add product')
            }
        } catch (error) {
            throw error
        } finally {
            setLoading(false)
        }
    }


    return (
        <form onSubmit={e => toast.promise(onSubmitHandler(e), { 
            loading: "Adding Product...", 
            success: "Product added successfully!", 
            error: (err) => err.message || "Failed to add product" 
        })} className="text-slate-500 mb-28">
            <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>
            <p className="mt-7">Product Images</p>
            <p className="text-sm text-slate-400 mb-4">Upload images by dragging and dropping or clicking to browse. Alternatively, enter image URLs directly.</p>

            <div className="flex flex-col gap-4 mt-4">
                {images.map((image, index) => (
                    <div key={index} className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Image {index + 1}</label>
                        
                        {/* Drag and Drop Area */}
                        <div 
                            className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                                dragOver[index] 
                                    ? 'border-blue-400 bg-blue-50' 
                                    : uploadedFiles[index] || image
                                        ? 'border-green-400 bg-green-50'
                                        : 'border-slate-300 hover:border-slate-400'
                            }`}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={(e) => handleDragLeave(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                        >
                            {uploadedFiles[index] || image ? (
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={uploadedFiles[index] || image} 
                                        alt={`Preview ${index + 1}`} 
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-green-600 font-medium">Image uploaded</p>
                                        <p className="text-xs text-slate-500 truncate">{uploadedFiles[index] || image}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <XIcon size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    {uploading[index] ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                            <p className="text-sm text-slate-600">Uploading...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <UploadIcon size={24} className="text-slate-400" />
                                            <p className="text-sm text-slate-600">
                                                Drag and drop an image here, or{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRefs[index].current?.click()}
                                                    className="text-blue-500 hover:text-blue-600 underline"
                                                >
                                                    browse files
                                                </button>
                                            </p>
                                            <p className="text-xs text-slate-400">PNG, JPG, GIF up to 5MB</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <input
                                ref={fileInputRefs[index]}
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files[0] && handleFileUpload(index, e.target.files[0])}
                                className="hidden"
                            />
                        </div>

                        {/* URL Input as Alternative */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">Or enter URL:</span>
                            <input 
                                type="url" 
                                value={image && !uploadedFiles[index] ? image : ''} 
                                onChange={e => onImageChange(index, e.target.value)} 
                                placeholder="https://example.com/image.jpg" 
                                className="flex-1 p-2 px-3 outline-none border border-slate-200 rounded text-sm" 
                            />
                        </div>
                    </div>
                ))}
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Name
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Enter product name" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Description
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Enter product description" rows={5} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
            </label>

            <div className="flex gap-5">
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Actual Price (₹)
                    <input type="number" name="mrp" onChange={onChangeHandler} value={productInfo.mrp} placeholder="0" rows={5} className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                </label>
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Offer Price (₹)
                    <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" rows={5} className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                </label>
            </div>

            <select onChange={e => setProductInfo({ ...productInfo, category: e.target.value })} value={productInfo.category} className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded" required>
                <option value="">Select a category</option>
                {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                ))}
            </select>

            <br />

            <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">Add Product</button>
        </form>
    )
}