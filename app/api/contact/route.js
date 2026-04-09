import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request) {
    try {
        const { name, email, phone, company, message, plan } = await request.json();

        if (!name || !email || !message) {
            return NextResponse.json({ message: 'Name, email, and message are required' }, { status: 400 });
        }

        // Create contact inquiry
        const contact = await prisma.contact.create({
            data: {
                name,
                email,
                phone: phone || null,
                company: company || null,
                message,
                plan: plan || 'ENTERPRISE',
                status: 'NEW',
            }
        });

        // TODO: Send email notification to admin about new contact inquiry
        // You can integrate with services like SendGrid, Mailgun, etc.

        console.log('New contact inquiry:', {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            plan: contact.plan,
            message: contact.message.substring(0, 100) + '...'
        });

        return NextResponse.json({
            message: 'Message sent successfully. We will get back to you soon.',
            contactId: contact.id
        });

    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    // This could be used by admin to view contact inquiries
    // For now, just return a message
    return NextResponse.json({ message: 'Contact inquiries are handled by admin panel' });
}