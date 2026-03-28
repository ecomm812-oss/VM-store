'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { TrashIcon, EditIcon, UploadIcon, XIcon } from 'lucide-react';

export default function BannerManagement() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [fileUploading, setFileUploading] = useState(false);
    const [hasStore, setHasStore] = useState(null);
    const [storeError, setStoreError] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        order: 0
    });
    const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = React.useRef(null);

    // Fetch banners and check if store exists
    useEffect(() => {
        fetchBanners();
        checkStoreExists();
    }, []);

    const fetchBanners = async () => {
        try {
            const response = await fetch('/api/store/banners');
            const data = await response.json();
            setBanners(data.banners || []);
        } catch (error) {
            console.error('Error fetching banners:', error);
            toast.error('Failed to load banners');
        } finally {
            setLoading(false);
        }
    };

    const checkStoreExists = async () => {
        try {
            // First, call the debug endpoint to see what's happening
            const debugResponse = await fetch('/api/debug/store-check');
            const debugData = await debugResponse.json();
            console.log('=== STORE CHECK DEBUG ===');
            console.log(JSON.stringify(debugData, null, 2));
            
            // Then check the actual store info
            const response = await fetch('/api/store/info');
            console.log('Store info response:', { ok: response.ok, status: response.status });
            const data = await response.json();
            console.log('Store info data:', data);
            
            if (response.ok) {
                setHasStore(true);
                setStoreError(null);
            } else {
                if (response.status === 404) {
                    setHasStore(false);
                    setStoreError('You haven\'t created a store yet. Please create a store before uploading banners.');
                } else if (response.status === 401) {
                    setHasStore(false);
                    setStoreError('You are not authenticated. Please log in first.');
                } else {
                    setHasStore(false);
                    setStoreError(data.error || 'Unable to verify store. Please try again later.');
                }
            }
        } catch (error) {
            console.error('Error checking store:', error);
            setHasStore(false);
            setStoreError('Connection error. Please check your internet and try again.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'order' ? parseInt(value) : value
        }));
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setFileUploading(true);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formDataUpload
            });

            const data = await response.json();
            if (data.success) {
                setFormData(prev => ({
                    ...prev,
                    imageUrl: data.url
                }));
                toast.success('Image uploaded successfully!');
            } else {
                toast.error(data.error || 'Failed to upload image');
                setSelectedFile(null);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
            setSelectedFile(null);
        } finally {
            setFileUploading(false);
        }
    };

    const handleUploadBanner = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.imageUrl) {
            toast.error('Please fill in all required fields');
            return;
        }

        setUploading(true);
        try {
            console.log('Uploading banner with formData:', formData);
            
            const response = await fetch('/api/store/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            console.log('Banner upload response - Status:', response.status, 'OK:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('Banner created successfully:', data);
                toast.success('Banner uploaded successfully!');
                setFormData({ title: '', description: '', imageUrl: '', order: 0 });
                setSelectedFile(null);
                setUploadMode('url');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                fetchBanners();
            } else {
                const error = await response.json();
                console.log('Banner upload error response:', error);
                
                const errorMessage = error.details || error.error || 'Failed to create banner';
                
                if (error.error && error.error.includes('create a store')) {
                    toast.error('You need to create a store first!');
                } else {
                    toast.error(errorMessage);
                }
            }
        } catch (error) {
            console.error('Error uploading banner:', error);
            toast.error('An error occurred while uploading. Check console for details.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBanner = async (id) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;

        try {
            const response = await fetch(`/api/store/banners/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('Banner deleted successfully');
                fetchBanners();
            } else {
                toast.error('Failed to delete banner');
            }
        } catch (error) {
            console.error('Error deleting banner:', error);
            toast.error('An error occurred');
        }
    };

    const handleToggleBanner = async (id, isActive) => {
        try {
            const response = await fetch(`/api/store/banners/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive })
            });

            if (response.ok) {
                toast.success(isActive ? 'Banner deactivated' : 'Banner activated');
                fetchBanners();
            }
        } catch (error) {
            console.error('Error toggling banner:', error);
            toast.error('Failed to update banner');
        }
    };

    if (loading) {
        return <div className="p-6 text-center">Loading...</div>;
    }

    if (hasStore === false) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertIcon className="text-yellow-600 mt-1" size={24} />
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-yellow-800 mb-2">Store Required</h2>
                            <p className="text-yellow-700 mb-4">{storeError || 'You need to create a store before uploading banners.'}</p>
                            <div className="flex gap-3 flex-wrap">
                                {!storeError?.includes('not authenticated') && (
                                    <Link href="/create-store" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                        Create Your Store
                                    </Link>
                                )}
                                <button
                                    onClick={checkStoreExists}
                                    className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                                >
                                    Refresh Check
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-slate-800">Banner Management</h1>

            {/* Upload Form */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-slate-800">Upload New Banner</h2>

                {/* Upload Mode Selector */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setUploadMode('file')}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            uploadMode === 'file'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        📁 Upload File
                    </button>
                    <button
                        onClick={() => setUploadMode('url')}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            uploadMode === 'url'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        🔗 Use URL
                    </button>
                </div>

                <form onSubmit={handleUploadBanner} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Banner Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Summer Sale"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Order (Display Priority)
                        </label>
                        <input
                            type="number"
                            name="order"
                            value={formData.order}
                            onChange={handleInputChange}
                            placeholder="0"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Banner description"
                            rows="3"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>

                    {/* File Upload or URL Input */}
                    <div className="md:col-span-2">
                        {uploadMode === 'file' ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select Banner Image *
                                </label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        disabled={fileUploading}
                                        className="hidden"
                                        id="file-input"
                                    />
                                    <label htmlFor="file-input" className="cursor-pointer block">
                                        <UploadIcon size={40} className="mx-auto mb-2 text-slate-400" />
                                        <p className="text-slate-700 font-medium mb-1">
                                            {selectedFile ? selectedFile.name : 'Click to select or drag and drop'}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            PNG, JPG, GIF (max 5MB)
                                        </p>
                                    </label>
                                    {fileUploading && (
                                        <p className="text-sm text-blue-600 mt-2">Uploading...</p>
                                    )}
                                    {selectedFile && !fileUploading && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="mt-2 text-sm text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Image URL *
                                </label>
                                <input
                                    type="url"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/banner.jpg"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-sm text-slate-500 mt-2">
                                    Recommended size: 1400x500px
                                </p>
                            </div>
                        )}
                    </div>

                    {formData.imageUrl && (
                        <div className="md:col-span-2 border-2 border-dashed border-slate-300 rounded-lg p-4">
                            <p className="text-sm text-slate-600 mb-2">Preview:</p>
                            <div className="relative w-full h-48">
                                <Image
                                    src={formData.imageUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover rounded"
                                />
                            </div>
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={uploading || fileUploading || !formData.imageUrl}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <UploadIcon size={20} />
                            {uploading ? 'Uploading...' : 'Upload Banner'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Banners List */}
            <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-semibold mb-6 text-slate-800">Your Banners</h2>

                {banners.length === 0 ? (
                    <p className="text-center text-slate-500 py-12">No banners yet. Create your first banner!</p>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {banners.map(banner => (
                            <div key={banner.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative w-full md:w-40 h-24 flex-shrink-0">
                                        <Image
                                            src={banner.imageUrl}
                                            alt={banner.title}
                                            fill
                                            className="object-cover rounded"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800">{banner.title}</h3>
                                                {banner.description && (
                                                    <p className="text-slate-600 text-sm mt-1">{banner.description}</p>
                                                )}
                                                <p className="text-xs text-slate-500 mt-2">Order: {banner.order}</p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleBanner(banner.id, banner.isActive)}
                                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                                        banner.isActive
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {banner.isActive ? 'Active' : 'Inactive'}
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteBanner(banner.id)}
                                                    className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-1 text-sm"
                                                >
                                                    <TrashIcon size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
