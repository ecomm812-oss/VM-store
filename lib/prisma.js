import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis

// For development and production, use PostgreSQL with adapter
// Note: You need to set DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/vmstore"

let prisma

if (!globalForPrisma.prisma) {
  const pool = new Pool({ 
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })
  const adapter = new PrismaPg(pool)
  prisma = new PrismaClient({ adapter })
  globalForPrisma.prisma = prisma
} else {
  prisma = globalForPrisma.prisma
}

export { prisma }