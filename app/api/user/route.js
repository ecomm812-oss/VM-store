import { NextResponse } from 'next/server'
import { getCurrentUser, getOrCreateUserRecord, getUserDisplayName, getUserPrimaryEmail, shouldUseDatabaseFallback } from '@/lib/security'
import { sendLoginNotification } from '@/lib/email'

export async function GET() {
  try {
    const clerkUser = await getCurrentUser()
    if (!clerkUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getOrCreateUserRecord({
      clerkId: clerkUser.id,
      fallbackName: 'User'
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Notify admins when a user logs in (requires ADMIN_EMAILS + SENDGRID_API_KEY)
    if (user?.email) {
      sendLoginNotification(user.email).catch((sendError) => {
        console.error('[user route] Failed to send login notification', sendError)
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    if (shouldUseDatabaseFallback(error)) {
      const clerkUser = await getCurrentUser()
      if (!clerkUser?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return NextResponse.json({
        id: `dev-${clerkUser.id}`,
        clerkId: clerkUser.id,
        name: getUserDisplayName(clerkUser, 'User'),
        email: getUserPrimaryEmail(clerkUser, '', clerkUser.id),
        image: clerkUser.imageUrl || ''
      })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
