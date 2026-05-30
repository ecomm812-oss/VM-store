import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, getOrCreateUserRecord } from '@/lib/security'
import { getDevStoreByClerkId, shouldUseDevStoreFallback } from '@/lib/dev-store-fallback'

export async function GET() {
    try {
        const clerkId = await getAuthUserId()
        if (!clerkId) {
            console.log('No Clerk user found')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('Looking up user with clerkId:', clerkId)

        const user = await getOrCreateUserRecord({ clerkId, fallbackName: 'Store Owner' })
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('User found/created:', { id: user.id, clerkId: user.clerkId })

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        })

        if (!store) {
            console.log('No store found for userId:', user.id)
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        console.log('Store found:', { id: store.id, name: store.name })
        return NextResponse.json(store)
    } catch (error) {
        if (shouldUseDevStoreFallback(error)) {
            const clerkId = await getAuthUserId()
            if (!clerkId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            const store = await getDevStoreByClerkId(clerkId)
            if (!store) {
                return NextResponse.json({ error: 'Store not found' }, { status: 404 })
            }

            return NextResponse.json(store)
        }

        console.error('Store info error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
