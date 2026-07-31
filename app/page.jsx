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
        canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://vmcart.in',
    },
}

export default async function Home() {
    let latestProducts = []
    let bestSellingProducts = []

    try {
        ;[latestProducts, bestSellingProducts] = await Promise.all([
            getLatestProducts({ take: 3 }),
            getBestSellingProducts({ take: 4 })
        ])
    } catch (error) {
        console.error('Home page product loading failed:', error)
        latestProducts = []
        bestSellingProducts = []
    }

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'VM Cart',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://vmcart.in',
        logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vmcart.in'}/favicon.ico`,
        sameAs: ['https://www.instagram.com', 'https://www.facebook.com']
    }

    try {
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
    } catch (error) {
        console.error('Home page render failed:', error)
        return (
            <div className="min-h-screen bg-white">
                <Hero />
                <div className="mx-6 my-20 max-w-6xl rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-800">Welcome to VM Cart</h2>
                    <p className="mt-2 text-sm text-slate-600">The storefront is loading with a safe fallback so you can still browse the experience.</p>
                </div>
                <OurSpecs />
                <Newsletter />
            </div>
        )
    }
}
