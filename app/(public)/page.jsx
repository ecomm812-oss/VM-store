'use client'
import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import Newsletter from "@/components/Newsletter";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";
import SlidingBanner from "@/components/SlidingBanner";

export default function Home() {
    return (
        <div>
            <Hero />
            <div className="max-w-7xl mx-auto px-6 py-8">
                <SlidingBanner />
            </div>
            <LatestProducts />
            <BestSelling />
            <OurSpecs />
            <Newsletter />
        </div>
    );
}
