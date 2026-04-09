import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { plan, price } = await request.json();

        if (!plan || !price) {
            return NextResponse.json({ message: 'Plan and price are required' }, { status: 400 });
        }

        // Check if user has a store
        const store = await prisma.store.findUnique({
            where: { userId }
        });

        if (!store) {
            return NextResponse.json({ message: 'Store not found. Please create a store first.' }, { status: 404 });
        }

        // Check if user already has an active subscription
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

        // Create subscription request
        const subscription = await prisma.subscription.create({
            data: {
                storeId: store.id,
                plan: plan.toUpperCase(),
                price: parseFloat(price),
                status: 'PENDING',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            }
        });

        // TODO: Send email notification to admin about new subscription request
        // TODO: Integrate with payment gateway for actual payment processing

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
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Get user's store
        const store = await prisma.store.findUnique({
            where: { userId }
        });

        if (!store) {
            return NextResponse.json({ message: 'Store not found' }, { status: 404 });
        }

        // Get subscription
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