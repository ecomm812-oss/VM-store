'use client'
import { useRouter } from 'next/navigation'
import { SignIn } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import Loading from '@/components/Loading'

export default function AdminLoginPage() {
  const router = useRouter()
  const { isSignedIn, user, isLoaded } = useUser()
  const [accessDenied, setAccessDenied] = useState(false)
  const [deniedEmail, setDeniedEmail] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          const response = await fetch('/api/admin/auth')
          if (response.ok) {
            // User is admin, redirect to dashboard
            router.push('/admin')
          } else if (response.status === 403) {
            // User is authenticated but not admin
            setAccessDenied(true)
            setDeniedEmail(user.primaryEmailAddress?.emailAddress?.toLowerCase?.() || '')
          }
        } catch (error) {
          console.error('Admin verification failed:', error)
          setAccessDenied(true)
          setDeniedEmail(user.primaryEmailAddress?.emailAddress?.toLowerCase?.() || '')
        } finally {
          setChecking(false)
        }
      } else {
        setChecking(false)
      }
    }

    verifyAdminAccess()
  }, [isLoaded, isSignedIn, user, router])

  if (!isLoaded || checking) {
    return <Loading />
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-4">Your email ({deniedEmail}) is not authorized for admin access.</p>
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
