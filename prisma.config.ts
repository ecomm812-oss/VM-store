import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
const directUrl = process.env.DIRECT_URL

const pool = new Pool({ connectionString: directUrl || connectionString })
const adapter = new PrismaPg(pool)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasources: {
    db: {
      adapter,
    },
  },
})


