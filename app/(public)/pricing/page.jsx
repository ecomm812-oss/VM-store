
import Link from 'next/link';

export default function PricingPage() {
    return (
        <div className='mx-auto max-w-[700px] my-28'>
            <div className='text-center mb-16'>
                <h1 className='text-4xl font-bold text-slate-800 mb-4'>Seller Pricing Plans</h1>
                <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
                    Choose the perfect plan for your business. Start selling on VM Cart with our flexible pricing options designed for sellers of all sizes.
                </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8 mb-16'>
                <div className='bg-white border border-slate-200 rounded-lg p-8 text-center hover:shadow-lg transition-shadow'>
                    <h3 className='text-2xl font-semibold text-slate-800 mb-2'>Starter</h3>
                    <div className='text-4xl font-bold text-green-600 mb-4'>₹499<span className='text-lg font-normal'>/month</span></div>
                    <ul className='text-slate-600 space-y-2 mb-6'>
                        <li>Up to 50 products</li>
                        <li>Basic analytics</li>
                        <li>Email support</li>
                        <li>Standard commission: 5%</li>
                    </ul>
                    <Link href='/subscription?plan=starter' className='inline-block w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-center'>
                        Get Started
                    </Link>
                </div>

                <div className='bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center hover:shadow-lg transition-shadow relative'>
                    <div className='absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm'>
                        Most Popular
                    </div>
                    <h3 className='text-2xl font-semibold text-slate-800 mb-2'>Professional</h3>
                    <div className='text-4xl font-bold text-green-600 mb-4'>₹1,499<span className='text-lg font-normal'>/month</span></div>
                    <ul className='text-slate-600 space-y-2 mb-6'>
                        <li>Up to 500 products</li>
                        <li>Advanced analytics</li>
                        <li>Priority support</li>
                        <li>Lower commission: 3%</li>
                        <li>Custom store theme</li>
                    </ul>
                    <Link href='/subscription?plan=professional' className='inline-block w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-center'>
                        Get Started
                    </Link>
                </div>

                <div className='bg-white border border-slate-200 rounded-lg p-8 text-center hover:shadow-lg transition-shadow'>
                    <h3 className='text-2xl font-semibold text-slate-800 mb-2'>Enterprise</h3>
                    <div className='text-4xl font-bold text-green-600 mb-4'>₹4,999<span className='text-lg font-normal'>/month</span></div>
                    <ul className='text-slate-600 space-y-2 mb-6'>
                        <li>Unlimited products</li>
                        <li>Premium analytics</li>
                        <li>Dedicated account manager</li>
                        <li>Lowest commission: 2%</li>
                        <li>Custom integrations</li>
                        <li>API access</li>
                    </ul>
                    <Link href='/contact' className='inline-block w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-center'>
                        Contact Sales
                    </Link>
                </div>
            </div>

            <div className='bg-slate-50 rounded-lg p-8'>
                <h2 className='text-2xl font-semibold text-slate-800 mb-4'>Frequently Asked Questions</h2>
                <div className='space-y-6'>
                    <div>
                        <h3 className='font-semibold text-slate-800 mb-2'>How does the commission work?</h3>
                        <p className='text-slate-600'>We charge a percentage of each sale as commission. This covers platform fees, payment processing, and customer support.</p>
                    </div>
                    <div>
                        <h3 className='font-semibold text-slate-800 mb-2'>Can I change plans anytime?</h3>
                        <p className='text-slate-600'>Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of the next billing cycle.</p>
                    </div>
                    <div>
                        <h3 className='font-semibold text-slate-800 mb-2'>Is there a setup fee?</h3>
                        <p className='text-slate-600'>No setup fees for any of our plans. You only pay the monthly subscription and commission on sales.</p>
                    </div>
                    <div>
                        <h3 className='font-semibold text-slate-800 mb-2'>What payment methods do you accept?</h3>
                        <p className='text-slate-600'>We accept all major credit cards, debit cards, UPI, net banking, and digital wallets through our secure payment gateway.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}