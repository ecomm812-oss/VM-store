'use client'
import { Suspense } from "react"
import ProductCard from "@/components/ProductCard"
import { MoveLeftIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"
import Loading from "@/components/Loading"

 function ShopContent() {

    // get query params ?search=abc or ?category=Headphones
    const searchParams = useSearchParams()
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const router = useRouter()

    const products = useSelector(state => state.product.list)
    const productsLoading = useSelector(state => state.product.loading)
    const productsError = useSelector(state => state.product.error)

    const normalizedCategory = category?.trim().toLowerCase()

    const filteredProducts = products.filter(product => {
        const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !normalizedCategory || product.category.toLowerCase() === normalizedCategory;
        return matchesSearch && matchesCategory;
    });

    const displayTitle = category ? category : (search ? `Search: ${search}` : 'All');

    return (
        <div className="min-h-[70vh] mx-6">
            <div className=" max-w-7xl mx-auto">
                <h1 onClick={() => router.push('/shop')} className="text-2xl text-slate-500 my-6 flex items-center gap-2 cursor-pointer"> {(search || category) && <MoveLeftIcon size={20} />}  {displayTitle} <span className="text-slate-700 font-medium">Products</span></h1>
                <div className="grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto mb-32">
                    {productsLoading ? (
                        <div className="col-span-full w-full">
                            <Loading />
                        </div>
                    ) : productsError ? (
                        <p className="text-red-500 col-span-full">Unable to load products right now. Please refresh and try again.</p>
                    ) : filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
                    ) : (
                        <p className="text-slate-500 col-span-full">
                            {category ? 'No products found in this category.' : search ? 'No products found for this search.' : 'No products available right now.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}


export default function Shop() {
  return (
    <Suspense fallback={<div>Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}