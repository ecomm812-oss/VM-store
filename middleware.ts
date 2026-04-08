import { NextRequest, NextResponse } from 'next/server'

const isPublicRoute = (pathname: string): boolean => {
  const publicPatterns = [
    /^\/(?!admin|store)(.*)/,
    /^\/admin\/login/,
    /^\/(api|trpc)(.*)/,
  ]
  return publicPatterns.some(pattern => pattern.test(pathname))
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Allow all public routes (including API)
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }
  
  // In development, skip auth check for localhost
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next()
  }
  
  // In production, you would implement proper Clerk auth checks here
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
