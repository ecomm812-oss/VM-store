import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/security'

export async function POST(request) {
  try {
    const clerkUser = await getCurrentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, username, description, email, contact, address, logo } = await request.json()

    if (!name || !username || !email || !contact) {
      return NextResponse.json({ error: 'Missing required store fields' }, { status: 400 })
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          email: clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.primaryEmailAddress?.emailAddress || email,
          image: clerkUser.imageUrl || ''
        }
      })
    }

    const existingStore = await prisma.store.findFirst({
      where: { userId: user.id }
    })

    if (existingStore) {
      return NextResponse.json({ error: 'You already have a store' }, { status: 400 })
    }

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

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username already exists. Please choose a different username.' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to create store', details: error.message }, { status: 500 })
  }
}
