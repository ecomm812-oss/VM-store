import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET store's banners
export async function GET(req) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find user by clerkId to get database userId
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ banners: [] });
        }

        const store = await prisma.store.findUnique({
            where: { userId: user.id },
            select: { id: true }
        });

        if (!store) {
            return NextResponse.json({ banners: [] });
        }

        const banners = await prisma.banner.findMany({
            where: { storeId: store.id },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
        });

        return NextResponse.json({ banners });
    } catch (error) {
        console.error('Error fetching store banners:', error);
        return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
    }
}

// POST - Create/Upload banner
export async function POST(req) {
    try {
        console.log('=== BANNER CREATION START ===')
        const { userId: clerkId } = await auth();
        console.log('Auth result - clerkId:', clerkId)
        if (!clerkId) {
            console.log('No clerkId found, returning 401')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        console.log('Request body:', body)
        const { title, description, imageUrl, order } = body;

        if (!title || !imageUrl) {
            console.log('Missing required fields - title:', !!title, 'imageUrl:', !!imageUrl)
            return NextResponse.json({ error: 'Title and image URL are required' }, { status: 400 });
        }

        // Find user by clerkId to get database userId
        console.log('Looking up user with clerkId:', clerkId)
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true }
        });
        console.log('User lookup result:', user)

        if (!user) {
            console.log('User not found for clerkId:', clerkId)
            return NextResponse.json({ 
                error: 'User not found. Please log in again.' 
            }, { status: 404 });
        }

        console.log('Looking up store for userId:', user.id)
        const store = await prisma.store.findUnique({
            where: { userId: user.id },
            select: { id: true }
        });
        console.log('Store lookup result:', store)

        if (!store) {
            console.log('Store not found for userId:', user.id)
            return NextResponse.json({ 
                error: 'You must create a store first before uploading banners. Please go to Store Dashboard and create a store.' 
            }, { status: 404 });
        }

        console.log('Creating banner with data:', {
            title,
            description: description || '',
            imageUrl,
            order: order || 0,
            storeId: store.id
        })

        const banner = await prisma.banner.create({
            data: {
                title,
                description: description || '',
                imageUrl,
                order: order || 0,
                storeId: store.id
            }
        });

        console.log('Banner created successfully:', { id: banner.id, storeId: banner.storeId });
        return NextResponse.json({ banner }, { status: 201 });
    } catch (error) {
        console.error('Error creating banner - Full details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return NextResponse.json({ 
            error: 'Failed to create banner',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
