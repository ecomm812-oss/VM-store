import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, getOrCreateUserRecord } from '@/lib/security'
import { createDevStore, shouldUseDevStoreFallback } from '@/lib/dev-store-fallback'

export async function POST(request) {
  let body = null

  try {
    const clerkId = await getAuthUserId()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    body = await request.json()
    const name = body?.name?.trim()
    const username = body?.username?.trim()?.toLowerCase()
    const description = body?.description?.trim() || ''
    const email = body?.email?.trim()?.toLowerCase()
    const contact = body?.contact?.trim()
    const address = body?.address?.trim() || ''
    const logo = body?.logo

    if (!name || !username || !email || !contact) {
      return NextResponse.json({ error: 'Missing required store fields' }, { status: 400 })
    }

    if (username.length < 3 || username.length > 30 || !/^[a-z0-9_-]+$/.test(username)) {
      return NextResponse.json({ error: 'Username must be 3-30 chars and contain only lowercase letters, numbers, hyphen, or underscore.' }, { status: 400 })
    }

    const user = await getOrCreateUserRecord({ clerkId, fallbackEmail: email, fallbackName: 'Store Owner' })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    if (shouldUseDevStoreFallback(error)) {
      const clerkId = await getAuthUserId()
      if (!clerkId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      try {
        const store = await createDevStore({
          clerkId,
          name: body?.name?.trim(),
          username: body?.username?.trim() || '',
          description: body?.description?.trim() || '',
          email: body?.email?.trim()?.toLowerCase() || '',
          contact: body?.contact?.trim() || '',
          address: body?.address?.trim() || '',
          logo: body?.logo
        })

        return NextResponse.json(store, { status: 201 })
      } catch (fallbackError) {
        const statusCode = fallbackError?.statusCode || 500
        return NextResponse.json({ error: fallbackError.message || 'Failed to create store' }, { status: statusCode })
      }
    }

    if (error.code === 'P2002') {
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(',') : ''
      if (target.includes('username')) {
        return NextResponse.json({ error: 'Username already exists. Please choose a different username.' }, { status: 400 })
      }
      if (target.includes('clerkId')) {
        return NextResponse.json({ error: 'User account conflict detected. Please sign out and sign in again.' }, { status: 409 })
      }
      if (target.includes('email')) {
        return NextResponse.json({ error: 'Email is already linked to another account. Please use a different email.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'A duplicate record already exists.' }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Failed to create store', details: error.message }, { status: 500 })
  }
}
