import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { currentUser } from '@clerk/nextjs/server'
import { validateFileUpload, createSecureErrorResponse } from '@/lib/security'
import { put } from '@vercel/blob'

export async function POST(request) {
    try {
        // Check authentication - any logged-in user can upload
        const clerkUser = await currentUser()
        console.log('Clerk user check:', clerkUser ? 'User found' : 'No user found')
        if (!clerkUser) {
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

        try {
            const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV
            console.log('Environment check:', { NODE_ENV: process.env.NODE_ENV, VERCEL: process.env.VERCEL, isVercel })
            
            if (isVercel || process.env.NODE_ENV === 'production') {
                console.log('Using Vercel Blob storage')
                console.log('BLOB_READ_WRITE_TOKEN available:', !!process.env.BLOB_READ_WRITE_TOKEN)
                
                if (!process.env.BLOB_READ_WRITE_TOKEN) {
                    console.log('BLOB_READ_WRITE_TOKEN not available, this might be the issue')
                    throw new Error('Blob storage not configured - BLOB_READ_WRITE_TOKEN missing')
                }
                
                // Use Vercel Blob in production
                const blob = await put(fileName, buffer, {
                    access: 'public',
                    contentType: file.type
                })

                imageUrl = blob.url
                console.log('Blob upload successful:', imageUrl)
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
        } catch (uploadError) {
            console.error('Upload failed:', uploadError)
            throw uploadError
        }

        return NextResponse.json({
            success: true,
            url: imageUrl,
            message: 'Image uploaded successfully'
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }
}