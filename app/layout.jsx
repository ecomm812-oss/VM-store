import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import { ClerkProvider } from '@clerk/nextjs';
import AppInitializer from "@/components/AppInitializer";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "VM Cart - Shop smarter",
    description: "VM Cart - Shop smarter",
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en">
                <head>
                    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
                </head>
                <body className={`${outfit.className} antialiased`}>
                    <StoreProvider>
                        <AppInitializer />
                        <Toaster />
                        {children}
                    </StoreProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
