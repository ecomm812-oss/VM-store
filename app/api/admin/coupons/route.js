import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminUser, createSecureErrorResponse, sanitizeInput } from '@/lib/security'

export async function GET() {
    try {
        // Check admin authentication
        const isAdmin = await isAdminUser()
        if (!isAdmin) {
            return createSecureErrorResponse('admin access', 403)
        }

        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(coupons)
    } catch (error) {
        console.error('Admin coupons error:', error)
        return createSecureErrorResponse('fetching coupons', 500)
    }
}

export async function POST(request) {
    try {
        // Check admin authentication
        const isAdmin = await isAdminUser()
        if (!isAdmin) {
            return createSecureErrorResponse('admin access', 403)
        }

        const { code, description, discount, forNewUser, forMember, isPublic, expiresAt } = await request.json()

        // Validate and sanitize inputs
        const codeValidation = sanitizeInput(code, { maxLength: 20, minLength: 3, fieldName: 'coupon code' })
        if (!codeValidation.isValid) {
            return NextResponse.json({ error: codeValidation.error, code: 400 }, { status: 400 })
        }

        const descValidation = sanitizeInput(description, { maxLength: 500, minLength: 10, fieldName: 'description' })
        if (!descValidation.isValid) {
            return NextResponse.json({ error: descValidation.error, code: 400 }, { status: 400 })
        }

        // Validate discount
        const discountValue = parseFloat(discount)
        if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
            return NextResponse.json({ error: 'Discount must be a number between 1 and 100.', code: 400 }, { status: 400 })
        }

        // Validate expiration date
        const expiresDate = new Date(expiresAt)
        if (isNaN(expiresDate.getTime()) || expiresDate <= new Date()) {
            return NextResponse.json({ error: 'Expiration date must be in the future.', code: 400 }, { status: 400 })
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: codeValidation.sanitized.toUpperCase(),
                description: descValidation.sanitized,
                discount: discountValue,
                forNewUser: Boolean(forNewUser),
                forMember: Boolean(forMember),
                isPublic: Boolean(isPublic),
                expiresAt: expiresDate
            }
        })

        return NextResponse.json(coupon)
    } catch (error) {
        console.error('Admin create coupon error:', error)
        return createSecureErrorResponse('creating coupon', 500)
    }
}

export async function DELETE(request) {
    try {
        // Check admin authentication
        const isAdmin = await isAdminUser()
        if (!isAdmin) {
            return createSecureErrorResponse('admin access', 403)
        }

        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')

        // Validate input
        if (!code) {
            return createSecureErrorResponse('coupon deletion', 400)
        }

        const codeValidation = sanitizeInput(code, { maxLength: 20, minLength: 1, fieldName: 'coupon code' })
        if (!codeValidation.isValid) {
            return NextResponse.json({ error: codeValidation.error, code: 400 }, { status: 400 })
        }

        await prisma.coupon.delete({
            where: { code: codeValidation.sanitized.toUpperCase() }
        })

        return NextResponse.json({ message: 'Coupon deleted successfully' })
    } catch (error) {
        console.error('Admin delete coupon error:', error)
        return createSecureErrorResponse('deleting coupon', 500)
    }
}