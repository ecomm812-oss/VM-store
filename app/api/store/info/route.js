import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'

async function resolveUserForStoreInfo(clerkId) {
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
        const { userId: clerkId } = await auth()
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
        console.error('Store info error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}