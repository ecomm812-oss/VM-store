import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import ClerkProviderWithErrorBoundary from "@/components/ClerkProviderWithErrorBoundary";
import AppInitializer from "@/components/AppInitializer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "VM Cart - Shop smarter",
    description: "Discover and shop from independent sellers on VM Cart. Find unique products, local stores, and great deals with fast shipping and easy returns.",
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const isClerkConfigured = clerkPublishableKey.startsWith('pk_');

// ClerkProvider with error boundary
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
                <SpeedInsights />
            </body>
        </html>
    );
}

export default function RootLayout({ children }) {
    if (!isClerkConfigured) {
        return <AppShell>{children}</AppShell>;
    }

    return (
        <ClerkProviderWithErrorBoundary>
            <AppShell>{children}</AppShell>
        </ClerkProviderWithErrorBoundary>
    );
}
