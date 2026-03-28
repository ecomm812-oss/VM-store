import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET all active banners across all stores
export async function GET() {
    try {
        const banners = await prisma.banner.findMany({
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                store: {
                    select: { name: true, username: true }
                }
            }
        });

        return NextResponse.json({ banners });
    } catch (error) {
        console.error('Error fetching banners:', error);
        return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
    }
}
