#!/usr/bin/env node

/**
 * Security Health Check Script
 * Run this periodically to check your application's security posture
 */

const fs = require('fs')
const path = require('path')

console.log('🔒 VM Cart Security Health Check')
console.log('================================\n')

// Check 1: Environment variables
console.log('1. Environment Variables Check:')
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')

  if (envContent.includes('NEXT_PUBLIC_ADMIN_EMAILS')) {
    console.log('❌ CRITICAL: NEXT_PUBLIC_ADMIN_EMAILS found - admin emails exposed to frontend!')
  } else {
    console.log('✅ Admin emails not exposed to frontend')
  }

  if (envContent.includes('ADMIN_EMAILS')) {
    console.log('✅ Admin emails configured server-side')
  } else {
    console.log('⚠️  WARNING: ADMIN_EMAILS not configured')
  }
} else {
  console.log('⚠️  WARNING: .env file not found')
}

// Check 2: Security utilities
console.log('\n2. Security Utilities Check:')
const securityPath = path.join(__dirname, '..', 'lib', 'security.js')
if (fs.existsSync(securityPath)) {
  console.log('✅ Security utilities file exists')
} else {
  console.log('❌ CRITICAL: Security utilities file missing')
}

// Check 3: Rate limiting
console.log('\n3. Rate Limiting Check:')
const rateLimitPath = path.join(__dirname, '..', 'lib', 'rateLimit.js')
if (fs.existsSync(rateLimitPath)) {
  console.log('✅ Rate limiting utilities exist')
} else {
  console.log('⚠️  WARNING: Rate limiting not implemented')
}

// Check 4: Security headers
console.log('\n4. Security Headers Check:')
const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs')
if (fs.existsSync(nextConfigPath)) {
  const configContent = fs.readFileSync(nextConfigPath, 'utf8')
  if (configContent.includes('X-Frame-Options') && configContent.includes('X-Content-Type-Options')) {
    console.log('✅ Security headers configured')
  } else {
    console.log('⚠️  WARNING: Security headers may be incomplete')
  }
} else {
  console.log('❌ CRITICAL: Next.js config not found')
}

// Check 5: Admin endpoint protection
console.log('\n5. Admin Endpoint Protection:')
const adminFiles = [
  'app/api/admin/stores/route.js',
  'app/api/admin/approve/route.js',
  'app/api/admin/coupons/route.js'
]

let adminProtected = 0
adminFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8')
    if (content.includes('isAdminUser()')) {
      adminProtected++
    }
  }
})

console.log(`✅ ${adminProtected}/${adminFiles.length} admin endpoints protected`)

// Check 6: File upload security
console.log('\n6. File Upload Security:')
const uploadPath = path.join(__dirname, '..', 'app/api/upload/image/route.js')
if (fs.existsSync(uploadPath)) {
  const content = fs.readFileSync(uploadPath, 'utf8')
  if (content.includes('currentUser()') && content.includes('validateFileUpload')) {
    console.log('✅ File upload is secure')
  } else {
    console.log('⚠️  WARNING: File upload may not be fully secure')
  }
} else {
  console.log('❌ CRITICAL: File upload endpoint not found')
}

// Check 7: Order security
console.log('\n7. Order Security:')
const orderPath = path.join(__dirname, '..', 'app/api/orders/route.js')
if (fs.existsSync(orderPath)) {
  const content = fs.readFileSync(orderPath, 'utf8')
  if (content.includes('calculatedTotal') && content.includes('Math.abs(calculatedTotal - total)')) {
    console.log('✅ Order price manipulation prevented')
  } else {
    console.log('❌ CRITICAL: Order price manipulation vulnerability exists')
  }
} else {
  console.log('❌ CRITICAL: Order endpoint not found')
}

console.log('\n================================')
console.log('🔒 Security check complete!')
console.log('Review any CRITICAL or WARNING items above.')
console.log('See SECURITY_IMPLEMENTATION.md for details.')