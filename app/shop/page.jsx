import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { getPublicShopProducts, countPublicShopProducts } from '@/lib/product-service'

export const revalidate = 300

export default async function Shop({ searchParams }) {
    const resolvedParams = await searchParams
    const search = resolvedParams?.search?.trim() || ''
    const category = resolvedParams?.category?.trim() || ''

    const page = Math.max(1, parseInt(resolvedParams?.page || '1', 10) || 1)
    const pageSize = 24
    const skip = (page - 1) * pageSize

    const [products, totalCount] = await Promise.all([
        getPublicShopProducts({
            search: search || undefined,
            category: category || undefined,
            take: pageSize,
            skip
        }),
        countPublicShopProducts({
            search: search || undefined,
            category: category || undefined
        })
    ])

    const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize))

    const displayTitle = category || (search ? `Search: ${search}` : 'All')

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl text-slate-500 my-6 flex items-center gap-2">
                    {search || category ? (
                        <Link href="/shop" className="text-slate-500 hover:text-slate-700 transition">
                            ←
                        </Link>
                    ) : null}
                    {displayTitle} <span className="text-slate-700 font-medium">Products</span>
                </h1>
                <div className="grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto mb-6">
                    {products.length > 0 ? (
                        products.map((product) => <ProductCard key={product.id} product={product} />)
                    ) : (
                        <p className="text-slate-500 col-span-full">
                            {category ? 'No products found in this category.' : search ? 'No products found for this search.' : 'No products available right now.'}
                        </p>
                    )}
                </div>
                <div className="flex justify-between items-center max-w-7xl mx-auto mb-32 mt-4">
                    <div>
                        {page > 1 ? (
                            <Link href={`/shop?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}${category ? `&category=${encodeURIComponent(category)}` : ''}`} className="text-slate-500 hover:text-slate-700">← Prev</Link>
                        ) : null}
                    </div>
                    <div className="text-sm text-slate-600">Page {page} of {totalPages} ({totalCount || 0} products)</div>
                    <div>
                        {page < totalPages ? (
                            <Link href={`/shop?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}${category ? `&category=${encodeURIComponent(category)}` : ''}`} className="text-slate-500 hover:text-slate-700">Next →</Link>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}