import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import { ClerkProvider } from '@clerk/nextjs';
import AppInitializer from "@/components/AppInitializer";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import React from "react";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "VM Cart - Shop smarter",
    description: "Discover and shop from independent sellers on VM Cart. Find unique products, local stores, and great deals with fast shipping and easy returns.",
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const isClerkConfigured = clerkPublishableKey.startsWith('pk_');

// ClerkProvider with error boundary
function ClerkProviderWithErrorBoundary({ children }) {
    const [clerkError, setClerkError] = React.useState(null);
    
    React.useEffect(() => {
        // Listen for Clerk loading errors
        const handleError = (event) => {
            if (event.error?.code === 'failed_to_load_clerk_js') {
                console.warn('Clerk JS failed to load, continuing without authentication');
                setClerkError(event.error);
            }
        };
        
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleError);
        
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleError);
        };
    }, []);
    
    if (clerkError) {
        // Fallback: render without Clerk
        return <AppShell>{children}</AppShell>;
    }
    
    try {
        return (
            <ClerkProvider>
                {children}
            </ClerkProvider>
        );
    } catch (error) {
        console.warn('Clerk provider failed, continuing without authentication:', error);
        return <AppShell>{children}</AppShell>;
    }
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
