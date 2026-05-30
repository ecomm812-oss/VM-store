#!/usr/bin/env node

/**
 * Database Setup Script for VM-Store
 *
 * This script helps set up the database for development.
 * For production, use PostgreSQL (recommended: Neon.tech)
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 VM-Store Database Setup')
console.log('==========================\n')

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local')
if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found. Please create it first.')
    process.exit(1)
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8')

// Check if DATABASE_URL is already set
if (envContent.includes('DATABASE_URL=') && !envContent.includes('DATABASE_URL="postgresql://')) {
    console.log('✅ DATABASE_URL is already configured')
} else {
    console.log('📝 Setting up DATABASE_URL...')
    console.log('\nFor development, you have two options:')
    console.log('1. Use Neon.tech (free PostgreSQL cloud database)')
    console.log('2. Use local PostgreSQL')
    console.log('\nTo use Neon.tech:')
    console.log('1. Go to https://neon.tech')
    console.log('2. Create a free account')
    console.log('3. Create a new project')
    console.log('4. Copy the connection string')
    console.log('5. Add it to .env.local as DATABASE_URL')
    console.log('\nExample:')
    console.log('DATABASE_URL="postgresql://username:password@hostname:5432/database"')
    console.log('\nAfter setting up the database, run: npm run db:setup')
}

console.log('\n📋 Available database commands:')
console.log('npm run db:generate  - Generate Prisma client')
console.log('npm run db:push      - Push schema to database')
console.log('npm run db:seed      - Seed database with sample data')
console.log('npm run db:studio    - Open Prisma Studio')