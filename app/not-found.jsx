import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import AppInitializer from "@/components/AppInitializer";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

function AppShell({ children }) {
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
                    {children}
                </StoreProvider>
                <Analytics />
            </body>
        </html>
    );
}

export default function NotFound() {
    return (
        <AppShell>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
                    <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
                    <a
                        href="/"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Home
                    </a>
                </div>
            </div>
        </AppShell>
    );
}