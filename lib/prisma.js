import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis

const connectionString = process.env.DATABASE_URL

// NOTE: Currently we are using a direct connection to the database.
// In production, consider using Prisma Accelerate for connection pooling and caching.
// See: https://pris.ly/d/accelerate
export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString }))
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma