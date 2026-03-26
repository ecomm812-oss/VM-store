// Security utilities for authentication and authorization
import { currentUser } from '@clerk/nextjs/server'

/**
 * Check if the current user is an admin
 * @returns {Promise<boolean>} True if user is admin, false otherwise
 */
export async function isAdminUser() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) return false

    const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase?.() || ''
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
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
    const clerkUser = await currentUser()
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
  // Check file size (5MB limit)
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  if (file.size > MAX_SIZE) {
    return { isValid: false, error: 'File size too large. Maximum 5MB allowed.' }
  }

  // Check MIME type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Only image files are allowed.' }
  }

  // Check file extension (whitelist approach)
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

  // Basic XSS prevention
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

  return NextResponse.json({
    error: messages[statusCode] || 'An error occurred.',
    code: statusCode
  }, { status: statusCode })
}