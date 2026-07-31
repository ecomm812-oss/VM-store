import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis

const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/vmstore"

function createUnavailablePrismaProxy(reason) {
  const handler = {
    get() {
      return new Proxy(() => {
        throw new Error('Prisma unavailable: ' + reason)
      }, {
        apply() {
          throw new Error('Prisma unavailable: ' + reason)
        }
      })
    }
  }
  return new Proxy({}, handler)
}

let prisma

if (!globalForPrisma.prisma) {
  const isProduction = process.env.NODE_ENV === 'production'
  const pool = new Pool({
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    max: isProduction ? 20 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err)
  })

  let adapter
  try {
    adapter = new PrismaPg(pool)
  } catch (e) {
    console.error('Failed to create PrismaPg adapter:', e && e.message)
  }

  try {
    if (!adapter) throw new Error('No adapter available')
    prisma = new PrismaClient({
      adapter,
      log: isProduction ? ['warn', 'error'] : ['error', 'warn'],
    })

    // Do a light connectivity check but don't crash on failure
    try {
      // Attempt a simple lightweight call to validate connection
      // but don't await long — just ensure setup doesn't throw synchronously
      pool.query('SELECT 1').catch((err) => {
        console.error('Prisma pool test query failed:', err && err.message)
      })
    } catch (err) {
      console.error('Prisma connectivity check failed:', err && err.message)
    }

    process.on('SIGINT', async () => {
      try { await prisma.$disconnect() } catch (e) {}
      try { await pool.end() } catch (e) {}
      process.exit(0)
    })

    globalForPrisma.prisma = prisma
  } catch (err) {
    console.error('Prisma client initialization failed:', err && err.message)
    prisma = createUnavailablePrismaProxy(err && err.message)
    globalForPrisma.prisma = prisma
  }
} else {
  prisma = globalForPrisma.prisma
}

export { prisma }