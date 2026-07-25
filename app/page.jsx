import Hero from '@/components/Hero'
import Newsletter from '@/components/Newsletter'
import OurSpecs from '@/components/OurSpec'
import LatestProducts from '@/components/LatestProducts'
import BestSelling from '@/components/BestSelling'
import StructuredData from '@/components/StructuredData'
import { getLatestProducts, getBestSellingProducts } from '@/lib/product-service'

export const revalidate = 60

export const metadata = {
    title: 'VM Cart | Shop Local & Discover Unique Products',
    description: 'Shop from independent sellers and local stores on VM Cart. Discover unique products, electronics, fashion, and home essentials online.',
    alternates: {
        canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://vmcart.com',
    },
}

export default async function Home() {
    const [latestProducts, bestSellingProducts] = await Promise.all([
        getLatestProducts({ take: 3 }),
        getBestSellingProducts({ take: 4 })
    ])

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'VM Cart',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://vmcart.com',
        logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vmcart.com'}/favicon.ico`,
        sameAs: ['https://www.instagram.com', 'https://www.facebook.com']
    }

    return (
        <div>
            <StructuredData data={organizationSchema} />
            <Hero />
            <LatestProducts products={latestProducts} />
            <BestSelling products={bestSellingProducts} />
            <OurSpecs />
            <Newsletter />
        </div>
    )
}
