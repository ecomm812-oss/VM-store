import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { currentUser } from '@clerk/nextjs/server'
import { validateFileUpload, createSecureErrorResponse } from '@/lib/security'

export async function POST(request) {
    try {
        // Check authentication - any logged-in user can upload
        const clerkUser = await currentUser()
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
        const fileName = `${randomUUID()}.jpg` // Force .jpg extension for security

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads')
        try {
            await mkdir(uploadsDir, { recursive: true })
        } catch (error) {
            // Directory might already exist, continue
        }

        // Save file to public/uploads directory
        const filePath = join(uploadsDir, fileName)
        await writeFile(filePath, buffer)

        // Return the public URL
        const imageUrl = `/uploads/${fileName}`

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