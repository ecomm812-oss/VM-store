import { NextResponse } from 'next/server';
import { getOrCreateUserRecord } from '@/lib/security';
import { prisma } from '../../../../lib/prisma';

export async function POST(request) {
    try {
        const user = await getOrCreateUserRecord({ fallbackName: 'Store Owner' });

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { plan, price } = await request.json();

        if (!plan || !price) {
            return NextResponse.json({ message: 'Plan and price are required' }, { status: 400 });
        }

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        });

        if (!store) {
            return NextResponse.json({ message: 'Store not found. Please create a store first.' }, { status: 404 });
        }

        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                storeId: store.id,
                status: 'ACTIVE'
            }
        });

        if (existingSubscription) {
            return NextResponse.json({
                message: 'You already have an active subscription. Please contact support to change plans.'
            }, { status: 400 });
        }

        const subscription = await prisma.subscription.create({
            data: {
                storeId: store.id,
                plan: plan.toUpperCase(),
                price: parseFloat(price),
                status: 'PENDING',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
        });

        return NextResponse.json({
            message: 'Subscription request submitted successfully. Our team will contact you soon.',
            subscription: {
                id: subscription.id,
                plan: subscription.plan,
                price: subscription.price,
                status: subscription.status
            }
        });

    } catch (error) {
        console.error('Subscription error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const user = await getOrCreateUserRecord({ fallbackName: 'Store Owner' });

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        });

        if (!store) {
            return NextResponse.json({ message: 'Store not found' }, { status: 404 });
        }

        const subscription = await prisma.subscription.findFirst({
            where: { storeId: store.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ subscription });

    } catch (error) {
        console.error('Get subscription error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
