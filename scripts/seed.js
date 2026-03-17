const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    // Create a sample user
    const user = await prisma.user.upsert({
        where: { id: 'sample-user-id' },
        update: {},
        create: {
            id: 'sample-user-id',
            name: 'Sample User',
            email: 'sample@example.com',
            image: 'https://example.com/image.png'
        }
    })

    // Create a sample store
    const store = await prisma.store.upsert({
        where: { username: 'happyshop' },
        update: {},
        create: {
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
            images: ['https://example.com/tshirt1.jpg', 'https://example.com/tshirt2.jpg'],
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
            images: ['https://example.com/jeans1.jpg', 'https://example.com/jeans2.jpg'],
            category: 'Clothing',
            storeId: store.id
        }
    })

    console.log('Sample products created:', { tshirt, jeans })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })