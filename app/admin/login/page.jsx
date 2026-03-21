'use client'
import { useRouter } from 'next/navigation'
import { SignIn } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import Loading from '@/components/Loading'

export default function AdminLoginPage() {
  const router = useRouter()
  const { isSignedIn, user, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase?.() || ''
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || []
      
      if (adminEmails.includes(userEmail)) {
        router.push('/admin')
      } else {
        // User is logged in but not admin
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    }
  }, [isLoaded, isSignedIn, user, router])

  if (!isLoaded) {
    return <Loading />
  }

  if (isSignedIn && user) {
    const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase?.() || ''
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || []
    
    if (adminEmails.includes(userEmail)) {
      return <Loading />
    } else {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h1>
            <p className="text-slate-600 mb-4">Your email ({userEmail}) is not authorized for admin access.</p>
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Home
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">Admin Portal</h1>
          <p className="text-slate-500 text-center mb-6">Sign in to access the admin dashboard.</p>
        </div>
        <SignIn 
          path="/admin/login" 
          routing="path"
          signUpUrl="/sign-up"
          redirectUrl="/admin"
        />
      </div>
    </div>
  )
}
