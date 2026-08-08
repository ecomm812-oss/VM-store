import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/vmstore'

let prisma

if (!globalForPrisma.prisma) {
  const isProduction = process.env.NODE_ENV === 'production'
  const needsSsl = /sslmode=([^&]+)/i.test(connectionString) || /neon\.tech/i.test(connectionString)

  const pool = new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : (isProduction ? { rejectUnauthorized: false } : false),
    max: isProduction ? 20 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
  })

  const adapter = new PrismaPg(pool)

  prisma = new PrismaClient({
    adapter,
    log: isProduction ? ['warn', 'error'] : [],
  })

  globalForPrisma.prisma = prisma
} else {
  prisma = globalForPrisma.prisma
}

export { prisma }