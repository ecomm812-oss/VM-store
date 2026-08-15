 import Title from './Title'
import ProductCard from './ProductCard'

const BestSelling = ({ products = [] }) => {
    const displayQuantity = 4
    const bestSellingProducts = Array.isArray(products)
        ? products.slice(0, displayQuantity)
        : []

    const visibleCount = Math.min(bestSellingProducts.length, Array.isArray(products) ? products.length : 0)

    return (
        <div className='px-3 sm:px-6 my-16 sm:my-30 max-w-6xl mx-auto animate-fadeInUp overflow-x-hidden'>
            <div className='animate-slideInUp'>
                <Title title='Best Selling' description={`Showing ${visibleCount} of ${products.length} products`} href='/shop' />
            </div>
            <div className='mt-6 sm:mt-12 flex flex-wrap gap-3 sm:gap-6 lg:gap-8 xl:gap-12 justify-center sm:justify-start'>
                {bestSellingProducts.map((product) => (
                    <div key={product.id} className='flex justify-center'>
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default BestSelling