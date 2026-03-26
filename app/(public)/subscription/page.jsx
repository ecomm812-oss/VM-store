'use client'
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

const plans = {
    starter: {
        name: 'Starter',
        price: 499,
        features: [
            'Up to 50 products',
            'Basic analytics',
            'Email support',
            'Standard commission: 5%'
        ]
    },
    professional: {
        name: 'Professional',
        price: 1499,
        features: [
            'Up to 500 products',
            'Advanced analytics',
            'Priority support',
            'Lower commission: 3%',
            'Custom store theme'
        ]
    },
    enterprise: {
        name: 'Enterprise',
        price: 4999,
        features: [
            'Unlimited products',
            'Premium analytics',
            'Dedicated account manager',
            'Lowest commission: 2%',
            'Custom integrations',
            'API access'
        ]
    }
};

export default function SubscriptionPage() {
    const searchParams = useSearchParams();
    const planType = searchParams.get('plan');
    const [loading, setLoading] = useState(false);
    const [storeInfo, setStoreInfo] = useState(null);

    const plan = plans[planType];

    useEffect(() => {
        // Check if user has a store
        const checkStore = async () => {
            try {
                const response = await fetch('/api/store/info');
                if (response.ok) {
                    const data = await response.json();
                    setStoreInfo(data.store);
                }
            } catch (error) {
                console.error('Error checking store:', error);
            }
        };
        checkStore();
    }, []);

    const handleSubscribe = async () => {
        if (!storeInfo) {
            alert('You need to create a store first before subscribing to a plan.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/store/subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: planType,
                    price: plan.price
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Redirect to payment or success page
                alert('Subscription request submitted! Our team will contact you soon.');
                window.location.href = '/store';
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to subscribe. Please try again.');
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!plan) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <div className='text-center'>
                    <h1 className='text-2xl font-bold text-slate-800 mb-4'>Invalid Plan</h1>
                    <p className='text-slate-600 mb-6'>The selected plan is not available.</p>
                    <Link href='/pricing' className='bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors'>
                        View All Plans
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-slate-50 py-12'>
            <div className='max-w-2xl mx-auto px-6'>
                <Link href='/pricing' className='inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8'>
                    <ArrowLeftIcon size={20} />
                    Back to Pricing
                </Link>

                <div className='bg-white rounded-lg shadow-lg p-8'>
                    <div className='text-center mb-8'>
                        <h1 className='text-3xl font-bold text-slate-800 mb-2'>Subscribe to {plan.name} Plan</h1>
                        <p className='text-slate-600'>Start selling on VM Cart with this plan</p>
                    </div>

                    <div className='bg-slate-50 rounded-lg p-6 mb-8'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold text-slate-800'>{plan.name} Plan</h2>
                            <div className='text-right'>
                                <div className='text-3xl font-bold text-green-600'>₹{plan.price}</div>
                                <div className='text-slate-600'>/month</div>
                            </div>
                        </div>

                        <ul className='space-y-2'>
                            {plan.features.map((feature, index) => (
                                <li key={index} className='flex items-center gap-2 text-slate-600'>
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {!storeInfo ? (
                        <div className='text-center'>
                            <p className='text-slate-600 mb-4'>You need to create a store before subscribing to a plan.</p>
                            <Link href='/create-store' className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'>
                                Create Store First
                            </Link>
                        </div>
                    ) : (
                        <div className='text-center'>
                            <button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className='w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {loading ? 'Processing...' : `Subscribe to ${plan.name} Plan`}
                            </button>
                            <p className='text-sm text-slate-500 mt-4'>
                                By subscribing, you agree to our terms and conditions. Our team will contact you to complete the setup.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}