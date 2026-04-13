import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { validateFileUpload, createSecureErrorResponse, getAuthUserId } from '@/lib/security'
// import { put } from '@vercel/blob' // Import conditionally below
import { analyzeImage } from '@/lib/ai-image-analysis'
import { v2 as cloudinary } from 'cloudinary'

function hasValidClerkConfig() {
    const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
    const secret = process.env.CLERK_SECRET_KEY || ''

    return publishable.startsWith('pk_') && secret.startsWith('sk_')
}

async function saveFileLocally(buffer, fileName) {
    const uploadsDir = join(process.cwd(), 'public', 'uploads')

    try {
        await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
        console.error('Directory creation error:', error)
    }

    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    return `/uploads/${fileName}`
}

function createInlineImageUrl(buffer, contentType) {
    const mimeType = contentType || 'image/jpeg'
    return `data:${mimeType};base64,${buffer.toString('base64')}`
}

function hasCloudinaryConfig() {
    return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    )
}

async function uploadToCloudinary(buffer, fileName, contentType) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    })

    const dataUri = `data:${contentType || 'image/jpeg'};base64,${buffer.toString('base64')}`

    const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'vm-store',
        public_id: fileName.replace(/\.[^.]+$/, ''),
        resource_type: 'image'
    })

    return result.secure_url
}

async function storeImage(buffer, fileName, contentType) {
    const useCloudinary = hasCloudinaryConfig()
    const useBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
    console.log('Storage check:', {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        useCloudinary,
        useBlobStorage
    })

    if (useCloudinary) {
        console.log('Using Cloudinary storage')
        try {
            const cloudinaryUrl = await uploadToCloudinary(buffer, fileName, contentType)
            console.log('Cloudinary upload successful:', cloudinaryUrl)
            return { url: cloudinaryUrl, storage: 'cloudinary' }
        } catch (cloudinaryError) {
            console.error('Cloudinary upload failed, falling back:', cloudinaryError)
        }
    }

    if (useBlobStorage) {
        console.log('Using Vercel Blob storage')
        try {
            const { put } = await import('@vercel/blob')

            const blob = await put(fileName, buffer, {
                access: 'public',
                contentType
            })

            console.log('Blob upload successful:', blob.url)
            return { url: blob.url, storage: 'blob' }
        } catch (blobError) {
            console.error('Blob upload failed, falling back:', blobError)
        }
    }

    try {
        const localUrl = await saveFileLocally(buffer, fileName)
        console.log('Local file saved:', localUrl)
        return { url: localUrl, storage: 'local' }
    } catch (localError) {
        console.error('Local file storage failed, falling back to inline image:', localError)
        return {
            url: createInlineImageUrl(buffer, contentType),
            storage: 'inline'
        }
    }
}

export async function POST(request) {
    try {
        const isDevMode = process.env.NODE_ENV !== 'production' && !hasValidClerkConfig()

        let clerkId
        if (isDevMode) {
            console.log('Development mode: Bypassing Clerk auth for image upload')
            clerkId = 'dev_test_user_' + Date.now()
        } else {
            clerkId = await getAuthUserId()

            console.log('Clerk user check:', clerkId ? 'User found' : 'No user found')
            if (!clerkId) {
                return createSecureErrorResponse('file upload', 401)
            }
        }

        const data = await request.formData()
        const file = data.get('file')

        console.log('Upload request received:', {
            hasFile: !!file,
            fileName: file?.name,
            fileSize: file?.size,
            fileType: file?.type
        })

        if (!file) {
            return NextResponse.json({ error: 'No file received.', code: 400 }, { status: 400 })
        }

        const validation = validateFileUpload(file)
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error, code: 400 }, { status: 400 })
        }

        let buffer
        try {
            const bytes = await file.arrayBuffer()
            buffer = Buffer.from(bytes)
            console.log('File converted to buffer, size:', buffer.length)
        } catch (bufferError) {
            console.error('Failed to convert file to buffer:', bufferError)
            return NextResponse.json({ error: 'Failed to process file data', code: 400 }, { status: 400 })
        }

        const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']
        const ext = allowedExts.includes(originalExt) ? originalExt : 'jpg'
        const fileName = `${randomUUID()}.${ext}`

        const storedImage = await storeImage(buffer, fileName, file.type)
        const imageUrl = storedImage.url

        let imageAnalysis = null
        if (process.env.GOOGLE_AI_KEY) {
            try {
                console.log('Starting AI image analysis...')
                imageAnalysis = await analyzeImage(buffer, file.type || 'image/jpeg')

                console.log('Image analysis results:', {
                    description: imageAnalysis.description?.substring(0, 50),
                    tags: imageAnalysis.tags?.length || 0,
                    safe: imageAnalysis.isSafe,
                    action: imageAnalysis.recommendedAction
                })
            } catch (analysisError) {
                console.error('AI analysis error (non-blocking):', analysisError)
                imageAnalysis = {
                    description: '',
                    objects: [],
                    colors: [],
                    quality: 'unknown',
                    categories: [],
                    tags: [],
                    suggestions: [],
                    isSafe: true,
                    concerns: [],
                    recommendedAction: 'approve',
                    confidence: 0,
                    error: 'Analysis skipped'
                }
            }
        } else {
            console.log('GOOGLE_AI_KEY not configured, skipping image analysis')
            imageAnalysis = {
                description: '',
                objects: [],
                colors: [],
                quality: 'unknown',
                categories: [],
                tags: [],
                suggestions: [],
                isSafe: true,
                concerns: [],
                recommendedAction: 'approve',
                confidence: 0,
                error: 'Analysis not configured'
            }
        }

        return NextResponse.json({
            success: true,
            url: imageUrl,
            storage: storedImage.storage,
            message: 'Image uploaded successfully',
            ai: {
                description: imageAnalysis.description,
                objects: imageAnalysis.objects,
                colors: imageAnalysis.colors,
                quality: imageAnalysis.quality,
                categories: imageAnalysis.categories,
                tags: imageAnalysis.tags,
                suggestions: imageAnalysis.suggestions,
                contentSafe: imageAnalysis.isSafe,
                concerns: imageAnalysis.concerns,
                recommendedAction: imageAnalysis.recommendedAction,
                confidence: imageAnalysis.confidence
            }
        }, {
            status: 200
        })

    } catch (error) {
        console.error('Upload error:', error)

        let errorMessage = 'Failed to upload image'

        if (error.code === 'ENOSPC' || error.message?.includes('ENOSPC')) {
            errorMessage = 'Storage space full'
        } else if (error.code === 'EACCES' || error.message?.includes('EACCES')) {
            errorMessage = 'Permission denied'
        } else if (error.code === 'ENOENT' || error.message?.includes('ENOENT')) {
            errorMessage = 'Directory not found'
        } else if (error.code === 'EROFS' || error.message?.includes('EROFS')) {
            errorMessage = 'Local image storage is read-only on this server'
        } else if (error.code === 'ERR_INVALID_URL') {
            errorMessage = 'Invalid blob URL configuration'
        } else if (error.message?.toLowerCase().includes('token')) {
            errorMessage = 'Storage authentication failed'
        }

        return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 })
    }
}

export const runtime = 'nodejs'
export const maxDuration = 60
