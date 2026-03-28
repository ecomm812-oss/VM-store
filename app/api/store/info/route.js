import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            console.log('No Clerk user found')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('Looking up user with clerkId:', clerkUser.id)

        // Find the user in our database, or create if not exists
        let user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
            console.log('User not found, creating new user')
            // Create user if they don't exist
            user = await prisma.user.create({
                data: {
                    clerkId: clerkUser.id,
                    name: clerkUser.firstName + ' ' + clerkUser.lastName,
                    email: clerkUser.emailAddresses[0].emailAddress,
                    image: clerkUser.imageUrl
                }
            })
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
        console.error('Store info error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}