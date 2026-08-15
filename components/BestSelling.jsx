 import Title from './Title'
import ProductCard from './ProductCard'

const BestSelling = ({ products = [] }) => {
    const displayQuantity = 4
    const bestSellingProducts = Array.isArray(products)
        ? products.slice(0, displayQuantity)
        : []

    const visibleCount = Math.min(bestSellingProducts.length, Array.isArray(products) ? products.length : 0)

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto animate-fadeInUp'>
            <div className='animate-slideInUp'>
                <Title title='Best Selling' description={`Showing ${visibleCount} of ${products.length} products`} href='/shop' />
            </div>
            <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12'>
                {bestSellingProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}

export default BestSelling