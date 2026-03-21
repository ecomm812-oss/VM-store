import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

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

        const addressData = await request.json()
        const { name, email, street, city, state, zip, country, phone } = addressData

        // Validate required fields
        if (!name || !email || !street || !city || !state || !zip || !country || !phone) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const address = await prisma.address.create({
            data: {
                name,
                email,
                street,
                city,
                state,
                zip,
                country,
                phone,
                userId: user.id
            }
        })

        return NextResponse.json(address, { status: 201 })
    } catch (error) {
        console.error('Address creation error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(request) {
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

        const addresses = await prisma.address.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(addresses)
    } catch (error) {
        console.error('Address fetch error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}