"use client"
import React, { useEffect, useRef } from 'react'
import { ClerkProvider, useUser } from '@clerk/nextjs'

async function resolveUserLocation() {
  if (typeof window === 'undefined') return null

  const fallbackLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      if (!response.ok) return null

      const data = await response.json()
      return {
        street: 'Live location',
        city: data.city || '',
        state: data.region || '',
        zip: data.postal || '',
        country: data.country_name || ''
      }
    } catch (error) {
      console.error('Failed to resolve IP-based location:', error)
      return null
    }
  }

  if (!navigator.geolocation) {
    return fallbackLocation()
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`, {
            headers: {
              'Accept-Language': 'en'
            }
          })

          if (!response.ok) {
            resolve(await fallbackLocation())
            return
          }

          const data = await response.json()
          resolve({
            street: data.address?.road || data.address?.suburb || 'Live location',
            city: data.address?.city || data.address?.town || data.address?.village || '',
            state: data.address?.state || data.address?.region || '',
            zip: data.address?.postcode || '',
            country: data.address?.country || ''
          })
        } catch (error) {
          console.error('Failed to reverse geocode location:', error)
          resolve(await fallbackLocation())
        }
      },
      async () => {
        resolve(await fallbackLocation())
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    )
  })
}

function AutoSaveUserAddress() {
  const { isLoaded, isSignedIn, user } = useUser()
  const savedUserRef = useRef('')

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return

    if (savedUserRef.current === user.id) return
    savedUserRef.current = user.id

    const saveLiveAddress = async () => {
      try {
        const location = await resolveUserLocation()
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'User'
        const email = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || ''
        const phone = user.phoneNumbers?.[0]?.phoneNumber || 'Auto-saved'

        const payload = {
          name: fullName,
          email,
          street: location?.street || 'Live location',
          city: location?.city || 'Live location',
          state: location?.state || 'Live location',
          zip: location?.zip || 'Auto-saved',
          country: location?.country || 'Live location',
          phone,
          isLiveLocation: true
        }

        const response = await fetch('/api/user/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.error || 'Failed to save your live address')
        }
      } catch (error) {
        console.error('Failed to auto-save live address:', error)
      }
    }

    void saveLiveAddress()
  }, [isLoaded, isSignedIn, user?.id])

  return null
}

export default function ClientClerkProvider({ children, publishableKey }) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <AutoSaveUserAddress />
      {children}
    </ClerkProvider>
  )
}
