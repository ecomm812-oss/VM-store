import Hero from '@/components/Hero'
import Newsletter from '@/components/Newsletter'
import OurSpecs from '@/components/OurSpec'
import LatestProducts from '@/components/LatestProducts'
import BestSelling from '@/components/BestSelling'
import { getLatestProducts, getBestSellingProducts } from '@/lib/product-service'

export const revalidate = 60

export default async function Home() {
    const [latestProducts, bestSellingProducts] = await Promise.all([
        getLatestProducts({ take: 4 }),
        getBestSellingProducts({ take: 8 })
    ])

    return (
        <div>
            <Hero />
            <LatestProducts products={latestProducts} />
            <BestSelling products={bestSellingProducts} />
            <OurSpecs />
            <Newsletter />
        </div>
    )
}
