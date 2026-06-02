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
    }

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
            </div>
        </div>
    )
}