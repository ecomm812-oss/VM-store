import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const stores = await prisma.store.findMany({
            include: {
                user: true,
                Product: true,
                Order: true
            }
        })

        return NextResponse.json(stores)
    } catch (error) {
        console.error('Admin stores error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const { storeId, isActive } = await request.json()

        const store = await prisma.store.update({
            where: { id: storeId },
            data: { isActive }
        })

        return NextResponse.json(store)
    } catch (error) {
        console.error('Admin store update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}