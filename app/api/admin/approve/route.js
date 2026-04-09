import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminUser, createSecureErrorResponse } from '@/lib/security'

export async function GET() {
    try {
        // In development mode with placeholder Clerk keys, bypass auth check
        const isDevMode = process.env.NODE_ENV !== 'production' && (
            !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
            !process.env.CLERK_SECRET_KEY ||
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'your_clerk_key_here' ||
            process.env.CLERK_SECRET_KEY === 'your_clerk_secret_here'
        )

        if (!isDevMode) {
            // Check admin authentication only in production
            const isAdmin = await isAdminUser()
            if (!isAdmin) {
                return createSecureErrorResponse('admin access', 403)
            }
        } else {
            console.log('Development mode: Bypassing admin auth for approve endpoint')
        }

        const pendingStores = await prisma.store.findMany({
            where: { status: 'pending' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                Product: {
                    select: {
                        id: true,
                        name: true,
                        price: true
                    }
                }
            }
        })

        return NextResponse.json(pendingStores)
    } catch (error) {
        console.error('Admin approve stores error:', error)
        return createSecureErrorResponse('fetching pending stores', 500)
    }
}

export async function PATCH(request) {
    try {
        // In development mode with placeholder Clerk keys, bypass auth check
        const isDevMode = process.env.NODE_ENV !== 'production' && (
            !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
            !process.env.CLERK_SECRET_KEY ||
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'your_clerk_key_here' ||
            process.env.CLERK_SECRET_KEY === 'your_clerk_secret_here'
        )

        if (!isDevMode) {
            // Check admin authentication only in production
            const isAdmin = await isAdminUser()
            if (!isAdmin) {
                return createSecureErrorResponse('admin access', 403)
            }
        } else {
            console.log('Development mode: Bypassing admin auth for approve endpoint')
        }

        const { storeId, status } = await request.json()

        // Validate input
        if (!storeId || !status) {
            return createSecureErrorResponse('store approval', 400)
        }

        // Validate status is valid
        const validStatuses = ['approved', 'rejected', 'pending']
        if (!validStatuses.includes(status)) {
            return createSecureErrorResponse('store approval', 400)
        }

        // Check if store exists and is pending
        const existingStore = await prisma.store.findUnique({
            where: { id: storeId }
        })

        if (!existingStore) {
            return createSecureErrorResponse('store approval', 404)
        }

        if (existingStore.status !== 'pending') {
            return NextResponse.json({
                error: 'Store is not in pending status.',
                code: 400
            }, { status: 400 })
        }

        const store = await prisma.store.update({
            where: { id: storeId },
            data: {
                status,
                isActive: status === 'approved' // Auto-activate if approved
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json(store)
    } catch (error) {
        console.error('Admin approve store error:', error)
        return createSecureErrorResponse('approving store', 500)
    }
}