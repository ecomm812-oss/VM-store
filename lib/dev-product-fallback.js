import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { getAllDevStores, getDevStoreByClerkId } from '@/lib/dev-store-fallback'

const DEV_DATA_DIR = join(process.cwd(), '.dev-data')
const DEV_PRODUCT_FILE = join(DEV_DATA_DIR, 'products.json')

function isDevelopment() {
  return process.env.NODE_ENV !== 'production'
}

export function shouldUseDevProductFallback(error) {
  const message = error?.message || ''

  return isDevelopment() && (
    error?.code === 'P1001' ||
    error?.code === 'ECONNREFUSED' ||
    message.includes('ECONNREFUSED') ||
    message.includes("Can't reach database server") ||
    message.includes('Environment variable not found: DATABASE_URL') ||
    message.includes('Invalid `prisma.') ||
    message.includes('error validating datasource')
  )
}

async function ensureDevDataDir() {
  await mkdir(DEV_DATA_DIR, { recursive: true })
}

async function readDevProducts() {
  try {
    const content = await readFile(DEV_PRODUCT_FILE, 'utf8')
    const parsed = JSON.parse(content)
    return Array.isArray(parsed?.products) ? parsed.products : []
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

async function writeDevProducts(products) {
  await ensureDevDataDir()
  await writeFile(DEV_PRODUCT_FILE, JSON.stringify({ products }, null, 2), 'utf8')
}

function normalizeStringArray(values) {
  return Array.isArray(values)
    ? values.filter(value => typeof value === 'string' && value.trim())
    : []
}

function decorateStore(store) {
  if (!store) {
    return null
  }

  return {
    ...store,
    user: {
      id: store.userId,
      name: store.name,
      email: store.email,
      image: store.logo
    }
  }
}

function decorateProduct(product, store) {
  return {
    ...product,
    images: normalizeStringArray(product.images),
    sizes: normalizeStringArray(product.sizes),
    rating: Array.isArray(product.rating) ? product.rating : [],
    store: decorateStore(store)
  }
}

export async function getAllDevProducts() {
  return readDevProducts()
}

export async function getPublicDevProducts({ search = '', category = '' } = {}) {
  const [products, stores] = await Promise.all([readDevProducts(), getAllDevStores()])
  const storeById = new Map(stores.map(store => [store.id, store]))
  const normalizedSearch = search.trim().toLowerCase()
  const normalizedCategory = category.trim().toLowerCase()

  return products
    .filter(product => product.inStock)
    .map(product => decorateProduct(product, storeById.get(product.storeId)))
    .filter(product => product.images.length > 0)
    .filter(product => !normalizedSearch || product.name.toLowerCase().includes(normalizedSearch))
    .filter(product => !normalizedCategory || product.category.toLowerCase() === normalizedCategory)
}

export async function getDevProductsByClerkId(clerkId) {
  const store = await getDevStoreByClerkId(clerkId)
  if (!store) {
    return []
  }

  const products = await readDevProducts()
  return products
    .filter(product => product.storeId === store.id)
    .map(product => decorateProduct(product, store))
}

export async function getDevProductsByStoreId(storeId) {
  const [products, stores] = await Promise.all([readDevProducts(), getAllDevStores()])
  const store = stores.find(entry => entry.id === storeId)

  return products
    .filter(product => product.storeId === storeId && product.inStock)
    .map(product => decorateProduct(product, store))
}

export async function createDevProduct({ clerkId, name, description, mrp, price, category, images, sizes }) {
  const store = await getDevStoreByClerkId(clerkId)
  if (!store) {
    const error = new Error('Store not found')
    error.statusCode = 404
    throw error
  }

  const now = new Date().toISOString()
  const product = {
    id: `dev_product_${Date.now()}`,
    name,
    description,
    mrp: Number(mrp),
    price: Number(price),
    images: normalizeStringArray(images),
    sizes: normalizeStringArray(sizes),
    category,
    inStock: true,
    storeId: store.id,
    createdAt: now,
    updatedAt: now,
    rating: []
  }

  const products = await readDevProducts()
  products.unshift(product)
  await writeDevProducts(products)

  return decorateProduct(product, store)
}

export async function updateDevProductStock({ clerkId, productId, inStock }) {
  const store = await getDevStoreByClerkId(clerkId)
  if (!store) {
    const error = new Error('Store not found')
    error.statusCode = 404
    throw error
  }

  const products = await readDevProducts()
  const productIndex = products.findIndex(product => product.id === productId && product.storeId === store.id)

  if (productIndex === -1) {
    const error = new Error('Product not found or access denied')
    error.statusCode = 404
    throw error
  }

  const updatedProduct = {
    ...products[productIndex],
    inStock: Boolean(inStock),
    updatedAt: new Date().toISOString()
  }

  products[productIndex] = updatedProduct
  await writeDevProducts(products)

  return decorateProduct(updatedProduct, store)
}