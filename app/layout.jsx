import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import ClientClerkProvider from "@/components/ClientClerkProvider";
import AppInitializer from "@/components/AppInitializer";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vmcart.in';

export const metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'VM Cart | Shop Local & Discover Unique Products',
        template: '%s | VM Cart'
    },
    description: 'Discover and shop from independent sellers on VM Cart. Find unique products, local stores, and great deals with fast shipping and easy returns.',
    keywords: ['online shopping', 'local stores', 'marketplace', 'fashion', 'electronics', 'home decor'],
    alternates: {
        canonical: siteUrl,
    },
    openGraph: {
        title: 'VM Cart | Shop Local & Discover Unique Products',
        description: 'Discover and shop from independent sellers on VM Cart. Find unique products, local stores, and great deals with fast shipping and easy returns.',
        url: siteUrl,
        siteName: 'VM Cart',
        type: 'website',
        images: [`${siteUrl}/assets/pd.png`],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'VM Cart | Shop Local & Discover Unique Products',
        description: 'Discover and shop from independent sellers on VM Cart. Find unique products, local stores, and great deals with fast shipping and easy returns.',
        images: [`${siteUrl}/assets/pd.png`],
    },
    robots: {
        index: true,
        follow: true,
    },
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const isClerkConfigured = clerkPublishableKey.startsWith('pk_');

export default function RootLayout({ children }) {
    try {
        return (
            <html lang="en">
                <head suppressHydrationWarning={true} />
                <body className={`${outfit.className} antialiased`} suppressHydrationWarning={true}>
                    <Script
                        id="razorpay-checkout"
                        src="https://checkout.razorpay.com/v1/checkout.js"
                        strategy="afterInteractive"
                    />
                    <StoreProvider>
                        <AppInitializer />
                        <Toaster />
                        {isClerkConfigured ? (
                            <ClientClerkProvider publishableKey={clerkPublishableKey}>
                                <div className="min-h-screen bg-white">
                                    <Navbar />
                                    {children}
                                    <Footer />
                                </div>
                            </ClientClerkProvider>
                        ) : (
                            <div className="min-h-screen bg-white">
                                <Navbar />
                                {children}
                                <Footer />
                            </div>
                        )}
                    </StoreProvider>
                    <Analytics />
                </body>
            </html>
        );
    } catch (error) {
        console.error('Root layout render failed:', error)
        return (
            <html lang="en">
                <body className={`${outfit.className} antialiased`} suppressHydrationWarning={true}>
                    <div className="min-h-screen bg-white">
                        <Navbar />
                        <main className="mx-6 py-10">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-700">
                                VM Cart is loading with a safe fallback. Please refresh if the storefront takes a moment.
                            </div>
                        </main>
                        <Footer />
                    </div>
                </body>
            </html>
        )
    }
}
