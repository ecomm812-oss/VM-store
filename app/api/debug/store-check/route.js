import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request) {
    try {
        const clerkUser = await currentUser()
        
        const response = {
            timestamp: new Date().toISOString(),
            authentication: {
                clerkAuthenticated: !!clerkUser,
                clerkId: clerkUser?.id || null
            },
            databaseLookup: {}
        }

        if (!clerkUser) {
            response.databaseLookup.status = 'NOT_AUTHENTICATED'
            return NextResponse.json(response)
        }

        // Try to find user by clerkId
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id },
            select: { id: true, clerkId: true, email: true, name: true }
        })

        response.databaseLookup.userLookup = {
            clerkId: clerkUser.id,
            found: !!user,
            userRecord: user
        }

        if (!user) {
            response.databaseLookup.storeLookup = {
                status: 'USER_NOT_FOUND'
            }
            return NextResponse.json(response)
        }

        // Try to find store by userId
        const store = await prisma.store.findUnique({
            where: { userId: user.id },
            select: { id: true, name: true, username: true, status: true, isActive: true }
        })

        response.databaseLookup.storeLookup = {
            userId: user.id,
            found: !!store,
            storeRecord: store
        }

        return NextResponse.json(response)
    } catch (error) {
        return NextResponse.json({
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
