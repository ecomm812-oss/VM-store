import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(coupons)
    } catch (error) {
        console.error('Admin coupons error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const { code, description, discount, forNewUser, forMember, isPublic, expiresAt } = await request.json()

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                description,
                discount: parseFloat(discount),
                forNewUser,
                forMember,
                isPublic,
                expiresAt: new Date(expiresAt)
            }
        })

        return NextResponse.json(coupon)
    } catch (error) {
        console.error('Admin create coupon error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')

        await prisma.coupon.delete({
            where: { code }
        })

        return NextResponse.json({ message: 'Coupon deleted successfully' })
    } catch (error) {
        console.error('Admin delete coupon error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}