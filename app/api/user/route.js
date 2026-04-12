import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/security'
import { sendLoginNotification } from '@/lib/email'

export async function GET() {
  try {
    const clerkUser = await getCurrentUser()
    if (!clerkUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
          image: clerkUser.imageUrl || ''
        }
      })
    }

    // Notify admins when a user logs in (requires ADMIN_EMAILS + SENDGRID_API_KEY)
    if (user?.email) {
      sendLoginNotification(user.email).catch((sendError) => {
        console.error('[user route] Failed to send login notification', sendError)
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
