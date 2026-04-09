import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// For development, use SQLite database
// In production, you can switch back to PostgreSQL
export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma