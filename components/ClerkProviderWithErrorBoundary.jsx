'use client'

import { useEffect, useState } from 'react'
import { ClerkProvider } from '@clerk/nextjs'

export default function ClerkProviderWithErrorBoundary({ children }) {
  const [clerkError, setClerkError] = useState(null)

  useEffect(() => {
    const handleError = (event) => {
      const error = event.error || (event.reason && event.reason.error)
      if (error?.code === 'failed_to_load_clerk_js') {
        console.warn('Clerk JS failed to load, continuing without authentication')
        setClerkError(error)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleError)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
  }, [])

  if (clerkError) {
    return <>{children}</>
  }

  return <ClerkProvider>{children}</ClerkProvider>
}
