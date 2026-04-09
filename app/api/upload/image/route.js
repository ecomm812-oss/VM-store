import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { auth } from '@clerk/nextjs/server'
import { validateFileUpload, createSecureErrorResponse } from '@/lib/security'
// import { put } from '@vercel/blob' // Import conditionally below
import { analyzeImage, shouldApproveImage } from '@/lib/ai-image-analysis'

export async function POST(request) {
    try {
        // Check authentication - any logged-in user can upload
        // In development mode with placeholder Clerk keys, bypass auth check
        const isDevMode = process.env.NODE_ENV !== 'production' && (
            !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
            !process.env.CLERK_SECRET_KEY ||
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'your_clerk_key_here' ||
            process.env.CLERK_SECRET_KEY === 'your_clerk_secret_here'
        )

        let clerkId
        if (isDevMode) {
            console.log('Development mode: Bypassing Clerk auth for image upload')
            clerkId = 'dev_test_user_' + Date.now()
        } else {
            const authResult = await auth()
            clerkId = authResult.userId
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

        // Use comprehensive file validation
        const validation = validateFileUpload(file)
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error, code: 400 }, { status: 400 })
        }

        // Convert file to buffer
        let buffer
        try {
            const bytes = await file.arrayBuffer()
            buffer = Buffer.from(bytes)
            console.log('File converted to buffer, size:', buffer.length)
        } catch (bufferError) {
            console.error('Failed to convert file to buffer:', bufferError)
            return NextResponse.json({ error: 'Failed to process file data', code: 400 }, { status: 400 })
        }

        // Generate secure unique filename with proper extension
        const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']
        const ext = allowedExts.includes(originalExt) ? originalExt : 'jpg'
        const fileName = `${randomUUID()}.${ext}`

        // Upload file based on environment
        let imageUrl
        const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV
        console.log('Environment check:', { NODE_ENV: process.env.NODE_ENV, VERCEL: process.env.VERCEL, isVercel })

        if (isVercel && process.env.BLOB_READ_WRITE_TOKEN) {
            console.log('Using Vercel Blob storage')
            try {
                // Dynamically import Vercel Blob to avoid issues in development
                const { put } = await import('@vercel/blob')
                
                // Use Vercel Blob in production
                const blob = await put(fileName, buffer, {
                    access: 'public',
                    contentType: file.type
                })

                imageUrl = blob.url
                console.log('Blob upload successful:', imageUrl)
            } catch (blobError) {
                console.error('Blob upload failed:', blobError)
                // Fallback to local storage if blob fails
                console.log('Falling back to local file storage')
                const uploadsDir = join(process.cwd(), 'public', 'uploads')
                try {
                    await mkdir(uploadsDir, { recursive: true })
                } catch (error) {
                    console.error('Directory creation error:', error)
                }

                const filePath = join(uploadsDir, fileName)
                await writeFile(filePath, buffer)
                imageUrl = `/uploads/${fileName}`
                console.log('Local file saved:', imageUrl)
            }
        } else {
            console.log('Using local file storage (development mode)')
            // Use local file storage in development
            // Create uploads directory if it doesn't exist
            const uploadsDir = join(process.cwd(), 'public', 'uploads')
            try {
                await mkdir(uploadsDir, { recursive: true })
            } catch (error) {
                console.error('Directory creation error:', error)
                // Directory might already exist, continue
            }

            // Save file to public/uploads directory
            const filePath = join(uploadsDir, fileName)
            await writeFile(filePath, buffer)

            imageUrl = `/uploads/${fileName}`
            console.log('Local file saved:', imageUrl)
        }

        // Perform AI image analysis (optional, only if API key is configured)
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
                // Continue without analysis if it fails
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
            status: 200 // Always return 200 on successful upload
        })

    } catch (error) {
        console.error('Upload error:', error)
        
        // Provide more specific error messages
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

// Configure this route for long operations (file upload and AI analysis)
export const maxDuration = 60  // 60 seconds max duration