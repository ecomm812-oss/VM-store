import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'

async function resolveUserForStore(clerkId, fallbackEmail) {
  let user = await prisma.user.findUnique({ where: { clerkId } })
  if (user) return user

  const clerkUser = await currentUser().catch(() => null)
  const displayName = `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim()
  const resolvedEmail = (
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    fallbackEmail ||
    `${clerkId}@clerk.local`
  ).toLowerCase()

  try {
    return await prisma.user.create({
      data: {
        clerkId,
        name: displayName || 'Store Owner',
        email: resolvedEmail,
        image: clerkUser?.imageUrl || ''
      }
    })
  } catch (error) {
    // Recover from legacy data conflicts where email exists with a stale clerkId.
    if (error?.code === 'P2002') {
      const existingByEmail = await prisma.user.findUnique({ where: { email: resolvedEmail } })
      if (existingByEmail) {
        return prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            clerkId,
            name: existingByEmail.name || displayName || 'Store Owner',
            image: existingByEmail.image || clerkUser?.imageUrl || ''
          }
        })
      }
    }
    throw error
  }
}

export async function POST(request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
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

    const user = await resolveUserForStore(clerkId, email)

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

    return NextResponse.json({ error: 'Failed to create store', details: error.message }, { status: 500 })
  }
}
