import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      console.warn('[Newsletter API] DATABASE_URL not set; skipping DB save for', normalizedEmail)
      return NextResponse.json({ message: 'Subscribed successfully (DB disabled)' }, { status: 200 })
    }

    try {
      const existing = await prisma.contact.findFirst({ where: { email: normalizedEmail } })
      if (!existing) {
        await prisma.contact.create({
          data: {
            name: 'Newsletter Subscriber',
            email: normalizedEmail,
            message: 'Newsletter subscription request',
          },
        })
      }
    } catch (dbError) {
      console.error('[Newsletter API] Prisma error saving email', dbError)
      return NextResponse.json({ message: 'Subscribed successfully (DB save failed)' }, { status: 200 })
    }

    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 200 })
  } catch (error) {
    console.error('[Newsletter API] Error parsing request / other', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
