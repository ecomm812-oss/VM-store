import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { validateFileUpload, createSecureErrorResponse, getAuthUserId } from '@/lib/security'
// import { put } from '@vercel/blob' // Import conditionally below
import { analyzeImage } from '@/lib/ai-image-analysis'

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

        let imageUrl
        const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV
        console.log('Environment check:', { NODE_ENV: process.env.NODE_ENV, VERCEL: process.env.VERCEL, isVercel })

        if (isVercel) {
            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('Blob token missing; falling back to local storage in non-production mode')
                    imageUrl = await saveFileLocally(buffer, fileName)
                    console.log('Local file saved:', imageUrl)
                } else {
                    console.error('Blob storage is not configured for this production deployment')
                    return NextResponse.json({
                        error: 'Image storage is not configured on the server.',
                        details: 'Set BLOB_READ_WRITE_TOKEN in your Vercel project environment variables.'
                    }, { status: 500 })
                }
            }

            if (!imageUrl) {
                console.log('Using Vercel Blob storage')
                try {
                    const { put } = await import('@vercel/blob')

                    const blob = await put(fileName, buffer, {
                        access: 'public',
                        contentType: file.type
                    })

                    imageUrl = blob.url
                    console.log('Blob upload successful:', imageUrl)
                } catch (blobError) {
                    console.error('Blob upload failed:', blobError)

                    return NextResponse.json({
                        error: 'Image storage upload failed.',
                        details: 'The server could not store the uploaded image in blob storage.'
                    }, { status: 500 })
                }
            }
        } else {
            console.log('Using local file storage (development mode)')
            imageUrl = await saveFileLocally(buffer, fileName)
            console.log('Local file saved:', imageUrl)
        }

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

        if (error.message?.includes('ENOSPC')) {
            errorMessage = 'Storage space full'
        } else if (error.message?.includes('EACCES')) {
            errorMessage = 'Permission denied'
        } else if (error.message?.includes('ENOENT')) {
            errorMessage = 'Directory not found'
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
