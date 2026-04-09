const { PrismaClient } = require('@prisma/client')

// Use the same configuration as lib/prisma.js
const prisma = new PrismaClient()

async function main() {
    // Create a sample user
    const user = await prisma.user.create({
        data: {
            clerkId: 'dev_user_' + Date.now(), // Generate a unique clerkId for dev
            name: 'Sample User',
            email: 'sample@example.com',
            image: 'https://example.com/image.png'
        }
    })

    // Create a sample store
    const store = await prisma.store.create({
        data: {
            userId: user.id,
            name: 'Happy Shop',
            description: 'Sample store for testing',
            username: 'happyshop',
            address: '123 Sample Street',
            status: 'approved',
            isActive: true,
            logo: 'https://example.com/logo.png',
            email: 'store@example.com',
            contact: '+1234567890'
        }
    })

    // Create sample products
    const tshirt = await prisma.product.create({
        data: {
            name: 'Classic Cotton T-Shirt',
            description: 'Comfortable cotton t-shirt perfect for everyday wear',
            mrp: 1999,
            price: 1499,
            images: ['https://picsum.photos/300/300?random=1', 'https://picsum.photos/300/300?random=2'],
            category: 'Clothing',
            storeId: store.id
        }
    })

    const jeans = await prisma.product.create({
        data: {
            name: 'Slim Fit Lover Jeans',
            description: 'Stylish slim fit jeans for a modern look',
            mrp: 4999,
            price: 3999,
            images: ['https://picsum.photos/300/300?random=3', 'https://picsum.photos/300/300?random=4'],
            category: 'Clothing',
            storeId: store.id
        }
    })

    console.log('Sample products created:', { tshirt, jeans })

    // Update images for existing products if any
    await prisma.product.updateMany({
        where: { name: 'Classic Cotton T-Shirt' },
        data: {
            images: ['https://picsum.photos/300/300?random=1', 'https://picsum.photos/300/300?random=2']
        }
    })

    await prisma.product.updateMany({
        where: { name: 'Slim Fit Lover Jeans' },
        data: {
            images: ['https://picsum.photos/300/300?random=3', 'https://picsum.photos/300/300?random=4']
        }
    })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })