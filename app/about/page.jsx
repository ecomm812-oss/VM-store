import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-5xl mx-auto rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-semibold text-slate-900">About VM Cart</h1>
        <p className="mt-6 text-slate-600 leading-7">
          VM Cart is a marketplace built to connect shoppers with independent sellers and local stores.
          We focus on easy navigation, secure checkout, and fast delivery so you can discover great products
          from trusted merchants across categories like electronics, fashion, home goods, and more.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 text-slate-700">
          <div>
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="mt-3 text-slate-600">
              To create a simple and delightful shopping experience for customers while empowering store owners
              to sell products online with minimal setup.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Why Choose Us</h2>
            <p className="mt-3 text-slate-600">
              Easy browsing, tailored product discovery, order tracking, and smooth checkout across one clean platform.
            </p>
          </div>
        </div>
        <div className="mt-10">
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 transition">
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  )
}
