import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const DEV_DATA_DIR = join(process.cwd(), '.dev-data')
const DEV_STORE_FILE = join(DEV_DATA_DIR, 'store-applications.json')

function isDevelopment() {
  return process.env.NODE_ENV !== 'production'
}

export function shouldUseDevStoreFallback(error) {
  return isDevelopment() && (
    error?.code === 'ECONNREFUSED' ||
    error?.message?.includes?.('ECONNREFUSED') ||
    error?.message?.includes?.("Can't reach database server")
  )
}

async function ensureDevDataDir() {
  await mkdir(DEV_DATA_DIR, { recursive: true })
}

async function readDevStores() {
  try {
    const content = await readFile(DEV_STORE_FILE, 'utf8')
    const parsed = JSON.parse(content)
    return Array.isArray(parsed?.stores) ? parsed.stores : []
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

async function writeDevStores(stores) {
  await ensureDevDataDir()
  await writeFile(DEV_STORE_FILE, JSON.stringify({ stores }, null, 2), 'utf8')
}

export async function getDevStoreByClerkId(clerkId) {
  const stores = await readDevStores()
  return stores.find(store => store.clerkId === clerkId) || null
}

export async function createDevStore({ clerkId, name, username, description, email, contact, address, logo }) {
  const stores = await readDevStores()

  const existingByOwner = stores.find(store => store.clerkId === clerkId)
  if (existingByOwner) {
    const error = new Error('You already have a store')
    error.statusCode = 400
    throw error
  }

  const normalizedUsername = username.toLowerCase()
  const existingByUsername = stores.find(store => store.username === normalizedUsername)
  if (existingByUsername) {
    const error = new Error('Username already exists. Please choose a different username.')
    error.statusCode = 400
    throw error
  }

  const now = new Date().toISOString()
  const store = {
    id: `dev_store_${Date.now()}`,
    userId: `dev_user_${clerkId}`,
    clerkId,
    name,
    username: normalizedUsername,
    description,
    address,
    status: 'pending',
    isActive: false,
    logo: logo || 'https://via.placeholder.com/200',
    email,
    contact,
    createdAt: now,
    updatedAt: now
  }

  stores.push(store)
  await writeDevStores(stores)
  return store
}

export async function getPendingDevStores() {
  const stores = await readDevStores()
  return stores
    .filter(store => store.status === 'pending')
    .map(store => ({
      ...store,
      user: {
        id: store.userId,
        name: store.name,
        email: store.email
      },
      Product: []
    }))
}

export async function updateDevStoreStatus(storeId, status) {
  const stores = await readDevStores()
  const storeIndex = stores.findIndex(store => store.id === storeId)

  if (storeIndex === -1) {
    const error = new Error('Store not found')
    error.statusCode = 404
    throw error
  }

  const existingStore = stores[storeIndex]
  if (existingStore.status !== 'pending') {
    const error = new Error('Store is not in pending status.')
    error.statusCode = 400
    throw error
  }

  const updatedStore = {
    ...existingStore,
    status,
    isActive: status === 'approved',
    updatedAt: new Date().toISOString()
  }

  stores[storeIndex] = updatedStore
  await writeDevStores(stores)

  return {
    ...updatedStore,
    user: {
      name: updatedStore.name,
      email: updatedStore.email
    }
  }
}