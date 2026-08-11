import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 })
    }

    const codeValidation = sanitizeInput(code, { maxLength: 20, minLength: 3, fieldName: 'coupon code' })
    if (!codeValidation.isValid) {
      return NextResponse.json({ error: codeValidation.error }, { status: 400 })
    }

    const couponCode = codeValidation.sanitized.toUpperCase()
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } })

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code.', status: 404 }, { status: 404 })
    }

    if (coupon.expiresAt <= new Date()) {
      return NextResponse.json({ error: 'Coupon has expired.' }, { status: 400 })
    }

    return NextResponse.json(coupon)
  } catch (error) {
    console.error('Coupon lookup error:', error)
    return NextResponse.json({ error: 'Unable to validate coupon at this time.' }, { status: 500 })
  }
}
