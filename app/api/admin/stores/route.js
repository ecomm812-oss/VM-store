import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdminUser, createSecureErrorResponse } from '@/lib/security'

export async function GET() {
    try {
        // Check admin authentication
        const isAdmin = await isAdminUser()
        if (!isAdmin) {
            return createSecureErrorResponse('admin access', 403)
        }

        const stores = await prisma.store.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        clerkId: true
                    }
                },
                Product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        inStock: true
                    }
                },
                Order: {
                    select: {
                        id: true,
                        total: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        })

        return NextResponse.json(stores)
    } catch (error) {
        console.error('Admin stores error:', error)
        return createSecureErrorResponse('fetching stores', 500)
    }
}

export async function POST(request) {
    try {
        // For development without Clerk, use a bypass system
        const isDevMode = process.env.NODE_ENV !== 'production' && (
            !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
            !process.env.CLERK_SECRET_KEY ||
            process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'your_clerk_key_here' ||
            process.env.CLERK_SECRET_KEY === 'your_clerk_secret_here'
        )

        let clerkId
        let clerkUser

        if (isDevMode) {
            console.log('Development mode: Using dev user for store creation')
            // In development without Clerk, use a default test clerk ID
            clerkId = 'dev_test_user_' + Date.now()
            clerkUser = {
                id: clerkId,
                firstName: 'Test',
                lastName: 'User',
                emailAddresses: [{ emailAddress: 'test@example.com' }],
                imageUrl: 'https://via.placeholder.com/150'
            }
        } else {
            clerkUser = await getCurrentUser()
            
            if (!clerkUser) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            clerkId = clerkUser.id
        }

        console.log('Creating store for clerkId:', clerkId)

        // Find the user in our database, or create if not exists
        let user = await prisma.user.findUnique({
            where: { clerkId: clerkId }
        })

        if (!user) {
            console.log('User not found, creating new user')
            // Create user if they don't exist
            user = await prisma.user.create({
                data: {
                    clerkId: clerkId,
                    name: clerkUser.firstName + ' ' + clerkUser.lastName,
                    email: clerkUser.emailAddresses[0].emailAddress,
                    image: clerkUser.imageUrl
                }
            })
            console.log('User created:', { id: user.id, clerkId: user.clerkId })
        } else {
            console.log('User found:', { id: user.id, clerkId: user.clerkId })
        }

        const { name, username, description, email, contact, address, logo } = await request.json()

        // Check if user already has a store
        const existingStores = await prisma.store.findMany({
            where: { userId: user.id }
        })

        if (existingStores.length > 0) {
            console.log('User already has a store:', existingStores[0].id)
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

        console.log('Store created successfully:', { id: store.id, name: store.name, userId: store.userId })
        return NextResponse.json(store, { status: 201 })
    } catch (error) {
        console.error('Store creation error:', error)
        
        // Handle specific error cases
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Username already exists. Please choose a different username.' }, { status: 400 })
        }
        
        if (error.message?.includes('Unique constraint failed')) {
            return NextResponse.json({ error: 'This store already exists. Please use a different name or username.' }, { status: 400 })
        }
        
        return NextResponse.json({ error: error.message || 'Failed to create store', full_error: error.toString() }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        // Check admin authentication
        const isAdmin = await isAdminUser()
        if (!isAdmin) {
            return createSecureErrorResponse('admin access', 403)
        }

        const { storeId, isActive } = await request.json()

        // Validate input
        if (!storeId || typeof isActive !== 'boolean') {
            return createSecureErrorResponse('store update', 400)
        }

        const store = await prisma.store.update({
            where: { id: storeId },
            data: { isActive },
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
        console.error('Admin store update error:', error)
        return createSecureErrorResponse('updating store', 500)
    }
}