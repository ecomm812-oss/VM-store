const { PrismaClient } = require('@prisma/client')

async function test() {
  const prisma = new PrismaClient()

  try {
    const users = await prisma.user.findMany()
    console.log('Database connection successful!')
    console.log('Users in database:', users.length)
  } catch (error) {
    console.error('Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()