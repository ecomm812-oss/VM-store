import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function POST(request) {
    try {
        const data = await request.formData()
        const file = data.get('file')

        if (!file) {
            return NextResponse.json({ error: 'No file received' }, { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate unique filename
        const fileExtension = file.name.split('.').pop()
        const fileName = `${randomUUID()}.${fileExtension}`

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads')
        try {
            await mkdir(uploadsDir, { recursive: true })
        } catch (error) {
            // Directory might already exist
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