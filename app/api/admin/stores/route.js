import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

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

export async function POST(request) {
    try {
        const clerkUser = await currentUser()
        
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find the user in our database, or create if not exists
        let user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
        })

        if (!user) {
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

        const { name, username, description, email, contact, address, logo } = await request.json()

        // Check if user already has a store
        const existingStores = await prisma.store.findMany({
            where: { userId: user.id }
        })

        if (existingStores.length > 0) {
            return NextResponse.json({ error: 'You already have a store' }, { status: 400 })
        }

        // Create new store
        const store = await prisma.store.create({
            data: {
                userId: user.id,
                name,
                username,
                description,
                email,
                contact,
                address,
                logo: logo || 'https://via.placeholder.com/200',
                status: 'pending',
                isActive: false
            }
        })

        return NextResponse.json(store, { status: 201 })
    } catch (error) {
        console.error('Store creation error:', error)
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