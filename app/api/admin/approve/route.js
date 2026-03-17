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

        const store = await prisma.store.update({
            where: { id: storeId },
            data: { status }
        })

        return NextResponse.json(store)
    } catch (error) {
        console.error('Admin approve store error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}