import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUserDisplayName, getUserPrimaryEmail, sanitizeInput, createSecureErrorResponse } from '@/lib/security'

export async function POST(request) {
    try {
        const clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
            return createSecureErrorResponse('address creation', 401)
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
                    name: getUserDisplayName(clerkUser, 'User'),
                    email: getUserPrimaryEmail(clerkUser, '', clerkUser.id),
                    image: clerkUser.imageUrl || ''
                }
            })
        }

        const addressData = await request.json()
        const { name, email, street, city, state, zip, country, phone } = addressData

        // Validate and sanitize all inputs
        const nameValidation = sanitizeInput(name, { maxLength: 100, minLength: 2, fieldName: 'name' })
        if (!nameValidation.isValid) {
            return NextResponse.json({ error: nameValidation.error, code: 400 }, { status: 400 })
        }

        const emailValidation = sanitizeInput(email, { maxLength: 254, minLength: 5, fieldName: 'email' })
        if (!emailValidation.isValid) {
            return NextResponse.json({ error: emailValidation.error, code: 400 }, { status: 400 })
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(emailValidation.sanitized)) {
            return NextResponse.json({ error: 'Invalid email format.', code: 400 }, { status: 400 })
        }

        const streetValidation = sanitizeInput(street, { maxLength: 200, minLength: 5, fieldName: 'street address' })
        if (!streetValidation.isValid) {
            return NextResponse.json({ error: streetValidation.error, code: 400 }, { status: 400 })
        }

        const cityValidation = sanitizeInput(city, { maxLength: 100, minLength: 2, fieldName: 'city' })
        if (!cityValidation.isValid) {
            return NextResponse.json({ error: cityValidation.error, code: 400 }, { status: 400 })
        }

        const stateValidation = sanitizeInput(state, { maxLength: 100, minLength: 2, fieldName: 'state' })
        if (!stateValidation.isValid) {
            return NextResponse.json({ error: stateValidation.error, code: 400 }, { status: 400 })
        }

        const zipValidation = sanitizeInput(zip, { maxLength: 20, minLength: 3, fieldName: 'zip code' })
        if (!zipValidation.isValid) {
            return NextResponse.json({ error: zipValidation.error, code: 400 }, { status: 400 })
        }

        const countryValidation = sanitizeInput(country, { maxLength: 100, minLength: 2, fieldName: 'country' })
        if (!countryValidation.isValid) {
            return NextResponse.json({ error: countryValidation.error, code: 400 }, { status: 400 })
        }

        const phoneValidation = sanitizeInput(phone, { maxLength: 20, minLength: 7, fieldName: 'phone number' })
        if (!phoneValidation.isValid) {
            return NextResponse.json({ error: phoneValidation.error, code: 400 }, { status: 400 })
        }

        const address = await prisma.address.create({
            data: {
                name: nameValidation.sanitized,
                email: emailValidation.sanitized,
                street: streetValidation.sanitized,
                city: cityValidation.sanitized,
                state: stateValidation.sanitized,
                zip: zipValidation.sanitized,
                country: countryValidation.sanitized,
                phone: phoneValidation.sanitized,
                userId: user.id
            }
        })

        return NextResponse.json(address, { status: 201 })
    } catch (error) {
        console.error('Address creation error:', error)

        if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json({ error: error.message || 'An internal server error occurred.', code: 500 }, { status: 500 })
        }

        return createSecureErrorResponse('creating address', 500)
    }
}

export async function GET() {
    try {
        const clerkUser = await getCurrentUser()
        if (!clerkUser?.id) {
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
                    name: getUserDisplayName(clerkUser, 'User'),
                    email: getUserPrimaryEmail(clerkUser, '', clerkUser.id),
                    image: clerkUser.imageUrl || ''
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