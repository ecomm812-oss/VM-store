import Title from './Title'
import ProductCard from './ProductCard'

const LatestProducts = ({ products = [] }) => {
    const displayQuantity = 10
    const latestProducts = Array.isArray(products) ? products.slice(0, displayQuantity) : []
    const visibleCount = Math.min(latestProducts.length, Array.isArray(products) ? products.length : 0)

    return (
        <div className='px-3 sm:px-6 my-16 sm:my-30 max-w-6xl mx-auto animate-fadeInUp overflow-x-hidden'>
            <div className='animate-slideInUp rounded-[30px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]'>
                <Title title='Latest Products' description={`Showing ${visibleCount} of ${products.length} products`} href='/shop' />
            </div>
            <div className='mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'>
                {latestProducts.map((product) => (
                    <div key={product.id} className='flex justify-center w-full'>
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default LatestProducts