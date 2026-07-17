import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

function hasValidClerkConfig() {
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  const secret = process.env.CLERK_SECRET_KEY || ''

  return publishable.startsWith('pk_') && secret.startsWith('sk_')
}

export default clerkMiddleware(async (auth, request) => {
  // If Clerk is not properly configured, just pass through
  if (!hasValidClerkConfig()) {
    return NextResponse.next()
  }

  // Clerk middleware will handle authentication
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.webp).*)',
  ],
}
