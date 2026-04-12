import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/security'
import { getDevStoreByClerkId, shouldUseDevStoreFallback } from '@/lib/dev-store-fallback'

async function resolveClerkId() {
    try {
        const { userId } = await auth()
        if (userId) return userId
    } catch (error) {
        console.warn('auth() failed in store info route:', error)
    }

    const fallbackUser = await getCurrentUser()
    return fallbackUser?.id || null
}

async function resolveUserForStoreInfo(clerkId) {
    if (!clerkId) {
        throw new Error('Missing clerkId for user lookup')
    }

    let user = await prisma.user.findUnique({ where: { clerkId } })
    if (user) return user

    const clerkUser = await currentUser().catch(() => null)
    const displayName = `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim()
    const resolvedEmail = (
        clerkUser?.emailAddresses?.[0]?.emailAddress ||
        clerkUser?.primaryEmailAddress?.emailAddress ||
        `${clerkId}@clerk.local`
    ).toLowerCase()

    try {
        return await prisma.user.create({
            data: {
                clerkId,
                name: displayName || 'Store Owner',
                email: resolvedEmail,
                image: clerkUser?.imageUrl || ''
            }
        })
    } catch (error) {
        if (error?.code === 'P2002') {
            const existingByEmail = await prisma.user.findUnique({ where: { email: resolvedEmail } })
            if (existingByEmail) {
                return prisma.user.update({
                    where: { id: existingByEmail.id },
                    data: {
                        clerkId,
                        name: existingByEmail.name || displayName || 'Store Owner',
                        image: existingByEmail.image || clerkUser?.imageUrl || ''
                    }
                })
            }
        }
        throw error
    }
}

export async function GET() {
    try {
        const clerkId = await resolveClerkId()
        if (!clerkId) {
            console.log('No Clerk user found')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('Looking up user with clerkId:', clerkId)

        // Find the user in our database, or create if not exists.
        const user = await resolveUserForStoreInfo(clerkId)

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
            const clerkId = await resolveClerkId()
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