<<<<<<< HEAD
import ProductCard from '@/components/ProductCard'
import Image from 'next/image'
import { MailIcon, MapPinIcon } from 'lucide-react'
import { getStoreWithProducts } from '@/lib/product-service'

export const revalidate = 60

export default async function StoreShop({ params }) {
    const { username } = params
    const storeData = await getStoreWithProducts(username)

    if (!storeData) {
        return (
            <div className="min-h-[70vh] mx-6">
                <div className="max-w-7xl mx-auto text-center py-24">
                    <p className="text-red-500 text-xl font-semibold">Store not found.</p>
                    <p className="text-slate-500 mt-4">The store you are looking for may not exist or is currently unavailable.</p>
                    <a href="/shop" className="text-blue-500 hover:text-blue-700 mt-6 inline-block">
                        Back to shop
                    </a>
                </div>
            </div>
        )
=======
export const revalidate = 60

import ProductCard from "@/components/ProductCard"
import Image from "next/image"
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

async function loadStoreData(username) {
  if (!username) return null

  const store = await prisma.store.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      email: true,
      logo: true,
      Product: {
        where: { inStock: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          mrp: true,
          price: true,
          images: true,
          sizes: true,
          category: true,
          createdAt: true
        }
      }
>>>>>>> beffe1f (chore: update project files)
    }
  })

<<<<<<< HEAD
    return (
        <div className="min-h-[70vh] mx-6">
            <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
                <Image
                    src={storeData.logo}
                    alt={storeData.storeName || storeData.name}
                    className="size-32 sm:size-38 object-cover border-2 border-slate-100 rounded-md"
                    width={200}
                    height={200}
                />
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-semibold text-slate-800">{storeData.storeName || storeData.name}</h1>
                    <p className="text-sm text-slate-600 mt-2 max-w-lg">{storeData.description}</p>
                    <div className="space-y-2 text-sm text-slate-500 mt-4">
                        <div className="flex items-center">
                            <MapPinIcon className="w-4 h-4 text-gray-500 mr-2" />
                            <span>{storeData.address}</span>
                        </div>
                        <div className="flex items-center">
                            <MailIcon className="w-4 h-4 text-gray-500 mr-2" />
                            <span>{storeData.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mb-40">
                <h1 className="text-2xl mt-12">Shop <span className="text-slate-800 font-medium">Products</span></h1>
                <div className="mt-5 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto">
                    {storeData.products.length > 0 ? (
                        storeData.products.map((product) => <ProductCard key={product.id} product={product} />)
                    ) : (
                        <p className="text-slate-500 col-span-full">No products are available from this store right now.</p>
                    )}
                </div>
=======
  if (!store) return null

  return {
    store: {
      id: store.id,
      name: store.name,
      description: store.description,
      address: store.address,
      email: store.email,
      logo: store.logo
    },
    products: store.Product.map(product => ({
      ...product,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes
    }))
  }
}

export default async function StoreShop({ params }) {
  const { username } = params
  const data = await loadStoreData(username)

  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-[70vh] mx-6">
      <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
        <Image
          src={data.store.logo}
          alt={data.store.name}
          className="size-32 sm:size-38 object-cover border-2 border-slate-100 rounded-md"
          width={200}
          height={200}
        />
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-semibold text-slate-800">{data.store.name}</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-lg">{data.store.description}</p>
          <div className="space-y-2 text-sm text-slate-500 mt-4">
            <div className="flex items-center">
              <span>{data.store.address}</span>
>>>>>>> beffe1f (chore: update project files)
            </div>
            <div className="flex items-center">
              <span>{data.store.email}</span>
            </div>
          </div>
        </div>
<<<<<<< HEAD
    )
}
=======
      </div>

      <div className="max-w-7xl mx-auto mb-40 mt-10">
        <h1 className="text-2xl">Shop <span className="text-slate-800 font-medium">Products</span></h1>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-12">
          {data.products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </div>
  )
}
>>>>>>> beffe1f (chore: update project files)
