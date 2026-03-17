import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const pendingStores = await prisma.store.findMany({
            where: { status: 'pending' },
            include: {
                user: true,
                Product: true
            }
        })

        return NextResponse.json(pendingStores)
    } catch (error) {
        console.error('Admin approve stores error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const { storeId, status } = await request.json()

        console.log('Approving store:', { storeId, status })

        // Check if store exists
        const existingStore = await prisma.store.findMany({
            where: { id: storeId }
        })

        if (!existingStore || existingStore.length === 0) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        const store = await prisma.store.updateMany({
            where: { id: storeId },
            data: { status }
        })

        if (store.count === 0) {
            return NextResponse.json({ error: 'Store not found or not updated' }, { status: 404 })
        }

        // Get the updated store
        const updatedStore = await prisma.store.findMany({
            where: { id: storeId }
        })

        console.log('Store updated:', updatedStore[0])
        return NextResponse.json(updatedStore[0])
    } catch (error) {
        console.error('Admin approve store error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}