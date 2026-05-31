import Title from './Title'
import ProductCard from './ProductCard'

const BestSelling = ({ products = [] }) => {
    const displayQuantity = 8
    const bestSellingProducts = products
        .slice()
        .sort((a, b) => {
            const aRatingCount = typeof a?.ratingCount === 'number' ? a.ratingCount : (a?.rating?.length || 0)
            const bRatingCount = typeof b?.ratingCount === 'number' ? b.ratingCount : (b?.rating?.length || 0)
            return bRatingCount - aRatingCount
        })
        .slice(0, displayQuantity)

    const visibleCount = Math.min(bestSellingProducts.length, products.length)

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