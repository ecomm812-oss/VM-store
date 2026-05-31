"use client"
import React from 'react'
import { ClerkProvider } from '@clerk/nextjs'

export default function ClientClerkProvider({ children, publishableKey }) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  )
}
