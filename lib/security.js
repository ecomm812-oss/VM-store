// Security utilities for authentication and authorization
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const DEV_SKIP_CLERK_AUTH = process.env.NODE_ENV !== 'production' && (
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  !process.env.CLERK_SECRET_KEY ||
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'your_clerk_key_here' ||
  process.env.CLERK_SECRET_KEY === 'your_clerk_secret_here'
)

const DEV_ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()).filter(Boolean) || []

function isDevAdminBypassEnabled() {
  return process.env.NODE_ENV !== 'production' && DEV_SKIP_CLERK_AUTH && DEV_ADMIN_EMAILS.length > 0
}

function buildDevUser() {
  const email = process.env.DEV_USER_EMAIL || 'dev@example.com'

  return {
    id: 'dev_user',
    firstName: 'Dev',
    lastName: 'User',
    emailAddresses: [{ emailAddress: email }],
    primaryEmailAddress: { emailAddress: email },
    imageUrl: 'https://via.placeholder.com/150'
  }
}

export function getUserDisplayName(clerkUser, fallbackName = 'Store Owner') {
  const displayName = `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim()
  return displayName || fallbackName
}

export function getUserPrimaryEmail(clerkUser, fallbackEmail = '', fallbackId = 'user') {
  return (
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    fallbackEmail ||
    `${fallbackId}@clerk.local`
  ).toLowerCase()
}

export async function getAuthUserId() {
  if (DEV_SKIP_CLERK_AUTH) {
    return buildDevUser().id
  }

  try {
    const authState = await auth()
    if (authState?.userId) {
      return authState.userId
    }
  } catch (error) {
    console.warn('Clerk auth() failed:', error)
  }

  const user = await getCurrentUser()
  return user?.id || null
}

export async function getCurrentUser() {
  if (DEV_SKIP_CLERK_AUTH) {
    console.warn('Clerk is not configured in development; returning a mock user')
    return buildDevUser()
  }

  try {
    const user = await currentUser()

    if (!user && process.env.NODE_ENV !== 'production') {
      console.warn('Clerk returned no user in development; using mock user fallback')
      return buildDevUser()
    }

    return user
  } catch (error) {
    console.warn('Clerk currentUser failed:', error)

    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using development mock user because Clerk currentUser threw an error')
      return buildDevUser()
    }

    return null
  }
}

export async function getOrCreateUserRecord(options = {}) {
  const {
    clerkId: providedClerkId,
    fallbackEmail = '',
    fallbackName = 'Store Owner',
    fallbackImage = ''
  } = options

  const clerkId = providedClerkId || await getAuthUserId()
  if (!clerkId) {
    return null
  }

  const existingUser = await prisma.user.findUnique({ where: { clerkId } })
  if (existingUser) {
    return existingUser
  }

  const clerkUser = await getCurrentUser()
  const resolvedName = getUserDisplayName(clerkUser, fallbackName)
  const resolvedEmail = getUserPrimaryEmail(clerkUser, fallbackEmail, clerkId)
  const resolvedImage = clerkUser?.imageUrl || fallbackImage || ''

  try {
    return await prisma.user.create({
      data: {
        clerkId,
        name: resolvedName,
        email: resolvedEmail,
        image: resolvedImage
      }
    })
  } catch (error) {
    if (error?.code === 'P2002') {
      const existingByEmail = await prisma.user.findUnique({ where: { email: resolvedEmail } })
      if (existingByEmail) {
        return prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            clerkId,
            name: existingByEmail.name || resolvedName,
            image: existingByEmail.image || resolvedImage
          }
        })
      }
    }

    throw error
  }
}

/**
 * Check if the current user is an admin
 * @returns {Promise<boolean>} True if user is admin, false otherwise
 */
export async function isAdminUser() {
  try {
    if (isDevAdminBypassEnabled()) {
      console.warn('Development admin bypass enabled; permitting admin access without Clerk auth')
      return true
    }

    const clerkUser = await getCurrentUser()
    if (!clerkUser) return false

    const email = getUserPrimaryEmail(clerkUser)
    const adminEmails = DEV_ADMIN_EMAILS
    return adminEmails.includes(email)
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

/**
 * Check if the current user is a store owner
 * @param {string} storeId - Optional store ID to check ownership for
 * @returns {Promise<{isOwner: boolean, userId?: string}>}
 */
export async function isStoreOwner(storeId = null) {
  try {
    const clerkUser = await getCurrentUser()
    if (!clerkUser) return { isOwner: false }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { store: true }
    })

    if (!user) return { isOwner: false }

    if (storeId) {
      return {
        isOwner: user.store?.id === storeId,
        userId: user.id
      }
    }

    return {
      isOwner: !!user.store,
      userId: user.id
    }
  } catch (error) {
    console.error('Store owner check error:', error)
    return { isOwner: false }
  }
}

/**
 * Validate file upload security
 * @param {File} file - The uploaded file
 * @returns {{isValid: boolean, error?: string}}
 */
export function validateFileUpload(file) {
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return { isValid: false, error: 'File size too large. Maximum 5MB allowed.' }
  }

  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Only image files are allowed.' }
  }

  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const fileName = file.name.toLowerCase()
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))

  if (!hasValidExtension) {
    return { isValid: false, error: 'Invalid file extension. Allowed: JPG, JPEG, PNG, GIF, WebP.' }
  }

  return { isValid: true }
}

/**
 * Sanitize and validate input data
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Validation options
 * @returns {{isValid: boolean, sanitized?: string, error?: string}}
 */
export function sanitizeInput(input, options = {}) {
  const {
    maxLength = 1000,
    minLength = 1,
    allowHtml = false,
    fieldName = 'input'
  } = options

  if (!input || typeof input !== 'string') {
    return { isValid: false, error: `${fieldName} is required and must be a string.` }
  }

  const trimmed = input.trim()

  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters long.` }
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be no more than ${maxLength} characters long.` }
  }

  let sanitized = trimmed
  if (!allowHtml) {
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  return { isValid: true, sanitized }
}

/**
 * Generic error response to prevent information disclosure
 * @param {string} operation - The operation that failed
 * @param {number} statusCode - HTTP status code
 * @returns {NextResponse}
 */
export function createSecureErrorResponse(operation = 'operation', statusCode = 500) {
  const messages = {
    400: 'Invalid request data provided.',
    401: 'Authentication required.',
    403: 'Access denied.',
    404: 'Resource not found.',
    500: 'An internal server error occurred.'
  }

  console.error(`Error in ${operation}: ${messages[statusCode] || 'An error occurred.'}`)

  return NextResponse.json({
    error: messages[statusCode] || 'An error occurred.',
    code: statusCode
  }, { status: statusCode })
}
