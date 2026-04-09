// Test script to check pending stores
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString }))
})

async function checkPendingStores() {
  try {
    console.log('Checking for pending stores...')
    
    const pendingStores = await prisma.store.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        Product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`\nFound ${pendingStores.length} pending store(s):`)
    if (pendingStores.length > 0) {
      console.log(JSON.stringify(pendingStores, null, 2))
    } else {
      console.log('❌ No pending stores found!\n')
      
      // Check all stores
      const allStores = await prisma.store.findMany({
        select: { id: true, name: true, status: true, userId: true }
      })
      console.log(`Total stores in database: ${allStores.length}`)
      console.log(allStores)
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkPendingStores()
