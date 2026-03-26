import { defineConfig } from 'prisma/config'

export default defineConfig({
  database: {
    url: process.env.DATABASE_URL,
  },
  client: {
    provider: 'prisma-client-js',
    engineType: 'library',
  },
})