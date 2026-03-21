import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ isAdmin: false, message: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim().toLowerCase()) || []
    const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() || ''

    const isAdmin = adminEmails.includes(userEmail)

    if (!isAdmin) {
      return NextResponse.json({ isAdmin: false, message: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ isAdmin: true, email: userEmail })
  } catch (error) {
    return NextResponse.json({ isAdmin: false, message: error.message }, { status: 500 })
  }
}
