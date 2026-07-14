require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deliveryCharge" DOUBLE PRECISION DEFAULT 0');
    await client.query('ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryCharge" DOUBLE PRECISION DEFAULT 0');
    console.log('deliveryCharge columns ready');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
