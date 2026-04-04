import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { auth } from '@clerk/nextjs/server'
import { validateFileUpload, createSecureErrorResponse } from '@/lib/security'
import { put } from '@vercel/blob'
import { analyzeImage, shouldApproveImage } from '@/lib/ai-image-analysis'

export async function POST(request) {
    try {
        // Check authentication - any logged-in user can upload
        const { userId: clerkId } = await auth()
        console.log('Clerk user check:', clerkId ? 'User found' : 'No user found')
        if (!clerkId) {
            return createSecureErrorResponse('file upload', 401)
        }

        const data = await request.formData()
        const file = data.get('file')

        if (!file) {
            return NextResponse.json({ error: 'No file received.', code: 400 }, { status: 400 })
        }

        // Use comprehensive file validation
        const validation = validateFileUpload(file)
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error, code: 400 }, { status: 400 })
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate secure unique filename with proper extension
        const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']
        const ext = allowedExts.includes(originalExt) ? originalExt : 'jpg'
        const fileName = `${randomUUID()}.${ext}`

        // Upload file based on environment
        let imageUrl
        const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV
        console.log('Environment check:', { NODE_ENV: process.env.NODE_ENV, VERCEL: process.env.VERCEL, isVercel })

        if (isVercel || process.env.NODE_ENV === 'production') {
            console.log('Using Vercel Blob storage')
            console.log('BLOB_READ_WRITE_TOKEN available:', !!process.env.BLOB_READ_WRITE_TOKEN)

            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                console.log('BLOB_READ_WRITE_TOKEN not available, using fallback data URL')
                // Fallback: Convert to data URL for small images (not recommended for production)
                const mimeType = file.type || 'image/jpeg'
                const base64 = buffer.toString('base64')
                imageUrl = `data:${mimeType};base64,${base64}`
                console.log('Using data URL fallback for image upload')
            } else {
                try {
                    // Use Vercel Blob in production
                    const blob = await put(fileName, buffer, {
                        access: 'public',
                        contentType: file.type
                    })

                    imageUrl = blob.url
                    console.log('Blob upload successful:', imageUrl)
                } catch (blobError) {
                    console.error('Blob upload failed:', blobError)
                    // Fallback to data URL if blob fails
                    const mimeType = file.type || 'image/jpeg'
                    const base64 = buffer.toString('base64')
                    imageUrl = `data:${mimeType};base64,${base64}`
                    console.log('Using data URL fallback after blob failure')
                }
            }
        } else {
            console.log('Using local file storage')
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

        // Perform AI image analysis
        console.log('Starting AI image analysis...')
        const imageAnalysis = await analyzeImage(buffer, file.type || 'image/jpeg')
        
        console.log('Image analysis results:', {
            description: imageAnalysis.description?.substring(0, 50),
            tags: imageAnalysis.tags?.length || 0,
            safe: imageAnalysis.isSafe,
            action: imageAnalysis.recommendedAction
        })

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
            status: imageAnalysis.isSafe ? 200 : 202 // 202 if needs review
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 }) 
    }
}