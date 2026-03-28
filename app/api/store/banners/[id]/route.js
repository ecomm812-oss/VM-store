import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// PUT - Update banner
export async function PUT(req, { params }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const { title, description, imageUrl, isActive, order } = await req.json();

        // Find user by clerkId to get database userId
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Verify the banner belongs to the store
        const banner = await prisma.banner.findUnique({
            where: { id }
        });

        if (!banner || banner.storeId !== store.id) {
            return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
        }

        const updatedBanner = await prisma.banner.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(imageUrl && { imageUrl }),
                ...(isActive !== undefined && { isActive }),
                ...(order !== undefined && { order })
            }
        });

        return NextResponse.json({ banner: updatedBanner });
    } catch (error) {
        console.error('Error updating banner:', error);
        return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
    }
}

// DELETE - Delete banner
export async function DELETE(req, { params }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        
        // Find user by clerkId to get database userId
        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const store = await prisma.store.findUnique({
            where: { userId: user.id }
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Verify the banner belongs to the store
        const banner = await prisma.banner.findUnique({
            where: { id }
        });

        if (!banner || banner.storeId !== store.id) {
            return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
        }

        await prisma.banner.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
    }
}
