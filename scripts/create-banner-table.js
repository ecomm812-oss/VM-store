#!/usr/bin/env node
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your .env.local file');
  process.exit(1);
}

const pool = new Pool({ connectionString });

const createBannerTableSQL = `
  CREATE TABLE IF NOT EXISTS "Banner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Banner_storeId_fkey" FOREIGN KEY ("storeId") 
      REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );

  CREATE INDEX IF NOT EXISTS "Banner_storeId_idx" ON "Banner"("storeId");
  CREATE INDEX IF NOT EXISTS "Banner_isActive_idx" ON "Banner"("isActive");
`;

async function createTable() {
  const client = await pool.connect();
  try {
    console.log('Creating Banner table...');
    await client.query(createBannerTableSQL);
    console.log('✅ Banner table created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

createTable();
