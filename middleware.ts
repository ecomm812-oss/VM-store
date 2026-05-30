import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'

function hasValidClerkConfig() {
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  const secret = process.env.CLERK_SECRET_KEY || ''

  return publishable.startsWith('pk_') && secret.startsWith('sk_')
}

const clerkHandler = clerkMiddleware(() => NextResponse.next())

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!hasValidClerkConfig()) {
    return NextResponse.next()
  }

  return clerkHandler(request, event)
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
