import HeroIndependenceDay from '@/components/HeroIndependenceDay'
import CountdownTimer from '@/components/CountdownTimer'
import IndependenceDayTestimonials from '@/components/IndependenceDayTestimonials'
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
        const [latest, bestSelling] = await Promise.all([
            getLatestProducts({ take: 4 }),
            getBestSellingProducts({ take: 4 })
        ])

        latestProducts = latest.slice(0, 4)
        bestSellingProducts = bestSelling.slice(0, 4)
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
                <HeroIndependenceDay />
                <CountdownTimer targetDate='2026-08-15' title='🇮🇳 Independence Day Sale Ends In' />
                <LatestProducts products={latestProducts} />
                <BestSelling products={bestSellingProducts} />
                <IndependenceDayTestimonials />
                <OurSpecs />
                <Newsletter />
            </div>
        )
    } catch (error) {
        console.error('Home page render failed:', error)
        return (
            <div className="min-h-screen bg-white">
                <HeroIndependenceDay />
                <CountdownTimer targetDate='2026-08-15' title='🇮🇳 Independence Day Sale Ends In' />
                <div className="mx-3 sm:mx-4 lg:mx-6 my-12 sm:my-20 max-w-6xl rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 text-center shadow-sm">
                    <h2 className="text-base sm:text-xl font-semibold text-slate-800">Welcome to VM Cart</h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600">The storefront is loading with a safe fallback so you can still browse the experience.</p>
                </div>
                <IndependenceDayTestimonials />
                <OurSpecs />
                <Newsletter />
            </div>
        )
    }
}
