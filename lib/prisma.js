import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis

// For development and production, use PostgreSQL with adapter
// Note: You need to set DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/vmstore"

let prisma

if (!globalForPrisma.prisma) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  const pool = new Pool({
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    // Connection pooling settings for high-traffic scenarios
    max: isProduction ? 20 : 5,           // max connections in pool
    idleTimeoutMillis: 30000,              // close idle connections after 30s
    connectionTimeoutMillis: 2000,         // fail fast on connection issues
  })

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err)
  })

  const adapter = new PrismaPg(pool)
  
  prisma = new PrismaClient({
    adapter,
    log: isProduction ? ['warn', 'error'] : ['query', 'error', 'warn'],
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    await pool.end()
    process.exit(0)
  })

  globalForPrisma.prisma = prisma
} else {
  prisma = globalForPrisma.prisma
}

export { prisma }