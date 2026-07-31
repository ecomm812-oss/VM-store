"use client"
import React, { useEffect, useRef } from 'react'
import { ClerkProvider, useUser } from '@clerk/nextjs'

async function resolveUserLocation() {
  if (typeof window === 'undefined' || !navigator.geolocation) return null

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
            headers: {
              'Accept-Language': 'en'
            }
          })

          if (!response.ok) {
            resolve({
              street: `Live location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              city: '',
              state: '',
              zip: '',
              country: '',
              latitude,
              longitude
            })
            return
          }

          const data = await response.json()
          resolve({
            street: data.address?.road || data.address?.suburb || `Live location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            city: data.address?.city || data.address?.town || data.address?.village || '',
            state: data.address?.state || data.address?.region || '',
            zip: data.address?.postcode || '',
            country: data.address?.country || '',
            latitude,
            longitude
          })
        } catch (error) {
          console.error('Failed to reverse geocode device location:', error)
          resolve({
            street: `Live location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            city: '',
            state: '',
            zip: '',
            country: '',
            latitude,
            longitude
          })
        }
      },
      () => {
        resolve(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
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
          isLiveLocation: true,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null
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
  if (!publishableKey) {
    return <>{children}</>
  }

  try {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        <AutoSaveUserAddress />
        {children}
      </ClerkProvider>
    )
  } catch (error) {
    console.error('ClientClerkProvider failed:', error)
    return <>{children}</>
  }
}
