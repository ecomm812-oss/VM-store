import Title from './Title'
import ProductCard from './ProductCard'

const LatestProducts = ({ products = [] }) => {
    const displayQuantity = 4
    const latestProducts = products.slice(0, displayQuantity)
    const visibleCount = Math.min(latestProducts.length, products.length)

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto animate-fadeInUp'>
            <div className='animate-slideInUp'>
                <Title title='Latest Products' description={`Showing ${visibleCount} of ${products.length} products`} href='/shop' />
            </div>
            <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 justify-between'>
                {latestProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    )
}

export default LatestProducts