'use client'
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

const isClerkConfigured = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '').startsWith('pk_');

const AuthDesktop = () => {
    const { isSignedIn } = useUser();

    return (
        <>
            {isSignedIn && (
                <Link href="/orders" className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-all duration-300 hover:scale-105">
                    My Orders
                </Link>
            )}

            {isSignedIn ? (
                <div className="animate-fadeIn">
                    <UserButton />
                </div>
            ) : (
                <SignInButton mode="modal">
                    <button className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition-all duration-300 text-white rounded-full btn-primary hover:shadow-lg">
                        Login
                    </button>
                </SignInButton>
            )}
        </>
    );
};

const AuthMobile = () => {
    const { isSignedIn } = useUser();

    return isSignedIn ? (
        <div className="animate-fadeIn">
            <UserButton />
        </div>
    ) : (
        <SignInButton mode="modal">
            <button className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition-all duration-300 text-white rounded-full btn-primary">
                Login
            </button>
        </SignInButton>
    );
};

const Navbar = () => {

    const router = useRouter();

    const [search, setSearch] = useState('')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const cartCount = useSelector(state => state.cart.total)

    const handleSearch = (e) => {
        e.preventDefault()

        const trimmedSearch = search.trim()
        if (!trimmedSearch) {
            router.push('/shop')
        } else {
            router.push(`/shop?search=${encodeURIComponent(trimmedSearch)}`)
        }

        setSearch('')
        setIsMobileMenuOpen(false) // Close mobile menu after search
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false)
    }

    return (
        <nav className="relative z-20 bg-white animate-slideInDown">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">

                    <Link href="/" className="relative text-4xl font-semibold text-slate-700 transition-transform duration-300 hover:scale-105">
                        <span className="text-green-600">VM</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                        <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500 animate-pulse">
                            plus
                        </p>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
                        <Link href="/" className="transition-all duration-300 hover:text-slate-800 hover:scale-105">Home</Link>
                        <Link href="/shop" className="transition-all duration-300 hover:text-slate-800 hover:scale-105">Shop</Link>
                        <Link href="/about" className="transition-all duration-300 hover:text-slate-800 hover:scale-105">About</Link>
                        <Link href="/contact" className="transition-all duration-300 hover:text-slate-800 hover:scale-105">Contact</Link>

                        <form onSubmit={handleSearch} className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full transition-all duration-300 hover:bg-slate-200 focus-within:bg-white focus-within:shadow-md">
                            <Search size={18} className="text-slate-600 transition-colors duration-300" />
                            <input className="w-full bg-transparent outline-none placeholder-slate-600 transition-colors duration-300" type="text" placeholder="Search stores & products" value={search} onChange={(e) => setSearch(e.target.value)} required />
                        </form>

                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600 transition-all duration-300 hover:text-slate-800 hover:scale-105 group">
                            <ShoppingCart size={18} className="group-hover:animate-bounce-custom" />
                            Cart
                            <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full transition-transform duration-300 group-hover:scale-125 animate-pulse-custom">{cartCount}</button>
                        </Link>

                        {isClerkConfigured ? (
                            <AuthDesktop />
                        ) : (
                            <Link href="/admin/login">
                                <button className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition-all duration-300 text-white rounded-full btn-primary hover:shadow-lg">
                                    Login
                                </button>
                            </Link>
                        )}

                    </div>

                    {/* Mobile Menu Button & User Button */}
                    <div className="sm:hidden flex items-center gap-3">
                        {/* Mobile Menu Toggle Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="p-2 text-slate-600 hover:text-slate-800 transition-all duration-300 hover:scale-110 active:scale-95"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Mobile User Button */}
                        {isClerkConfigured ? (
                            <AuthMobile />
                        ) : (
                            <Link href="/admin/login">
                                <button className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition-all duration-300 text-white rounded-full btn-primary">
                                    Login
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="sm:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={closeMobileMenu}>
                    <div
                        className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-xl animate-slideInRight"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            {/* Mobile Search */}
                            <form onSubmit={handleSearch} className="mb-6">
                                <div className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-full">
                                    <Search size={18} className="text-slate-600" />
                                    <input
                                        className="w-full bg-transparent outline-none placeholder-slate-600"
                                        type="text"
                                        placeholder="Search stores & products"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        required
                                    />
                                </div>
                            </form>

                            {/* Mobile Navigation Links */}
                            <div className="space-y-4">
                                <Link
                                    href="/"
                                    onClick={closeMobileMenu}
                                    className="block py-3 px-4 text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-300 hover:translate-x-2"
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/shop"
                                    onClick={closeMobileMenu}
                                    className="block py-3 px-4 text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-300 hover:translate-x-2"
                                >
                                    Shop
                                </Link>
                                <Link
                                    href="/about"
                                    onClick={closeMobileMenu}
                                    className="block py-3 px-4 text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-300 hover:translate-x-2"
                                >
                                    About
                                </Link>
                                <Link
                                    href="/contact"
                                    onClick={closeMobileMenu}
                                    className="block py-3 px-4 text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-300 hover:translate-x-2"
                                >
                                    Contact
                                </Link>

                                {/* Mobile Cart Link */}
                                <Link
                                    href="/cart"
                                    onClick={closeMobileMenu}
                                    className="flex items-center justify-between py-3 px-4 text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-300 hover:translate-x-2"
                                >
                                    <span className="flex items-center gap-2">
                                        <ShoppingCart size={18} />
                                        Cart
                                    </span>
                                    <span className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">
                                        {cartCount}
                                    </span>
                                </Link>

                                {/* Mobile My Orders Link */}
                                {isClerkConfigured && (
                                    <AuthMobileOrders onClose={closeMobileMenu} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <hr className="border-gray-300" />
        </nav>
    )
}

const AuthMobileOrders = ({ onClose }) => {
    const { isSignedIn } = useUser();

    if (!isSignedIn) return null;

    return (
        <Link
            href="/orders"
            onClick={onClose}
            className="block py-3 px-4 text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-300 hover:translate-x-2"
        >
            My Orders
        </Link>
    );
};

export default Navbar