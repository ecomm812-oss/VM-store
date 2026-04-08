import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      console.log('No clerk user found')
      return NextResponse.json({ isAdmin: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Temporarily hardcoded for testing - replace with env var later
    const adminEmails = ['abhishek.sharma1998r@gmail.com']
    const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() || ''

    console.log('Admin check:', {
      userEmail,
      adminEmails,
      clerkUserId: clerkUser.id,
      emailAddresses: clerkUser.emailAddresses
    })

    const isAdmin = adminEmails.includes(userEmail)

    if (!isAdmin) {
      console.log('User is not admin:', userEmail)
      return NextResponse.json({ isAdmin: false, message: 'Forbidden' }, { status: 403 })
    }

    console.log('User is admin:', userEmail)
    return NextResponse.json({ isAdmin: true, email: userEmail })
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ isAdmin: false, message: error.message }, { status: 500 })
  }
}
