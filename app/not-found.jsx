import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function NotFound() {
    return (
        <html lang="en">
            <head>
                <title>404 - Page Not Found | VM Cart</title>
            </head>
            <body className={`${outfit.className} antialiased min-h-screen flex items-center justify-center bg-gray-50`}>
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
            </body>
        </html>
    );
}