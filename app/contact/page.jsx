'use client'
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, MailIcon, PhoneIcon, MessageSquareIcon } from 'lucide-react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
        plan: 'enterprise'
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className='min-h-screen bg-slate-50 flex items-center justify-center py-12'>
                <div className='max-w-md mx-auto px-6 text-center'>
                    <div className='bg-white rounded-lg shadow-lg p-8'>
                        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                            <MailIcon className='w-8 h-8 text-green-600' />
                        </div>
                        <h1 className='text-2xl font-bold text-slate-800 mb-4'>Message Sent!</h1>
                        <p className='text-slate-600 mb-6'>
                            Thank you for contacting us. Our sales team will get back to you within 24 hours.
                        </p>
                        <Link href='/' className='bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors'>
                            Back to Home
                        </Link>
                    </div>
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
                        <h1 className='text-3xl font-bold text-slate-800 mb-2'>Contact Sales</h1>
                        <p className='text-slate-600'>Get in touch with our enterprise sales team</p>
                    </div>

                    <form onSubmit={handleSubmit} className='space-y-6'>
                        <div className='grid md:grid-cols-2 gap-6'>
                            <div>
                                <label htmlFor='name' className='block text-sm font-medium text-slate-700 mb-2'>
                                    Full Name *
                                </label>
                                <input
                                    type='text'
                                    id='name'
                                    name='name'
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
                                    placeholder='Your full name'
                                />
                            </div>
                            <div>
                                <label htmlFor='email' className='block text-sm font-medium text-slate-700 mb-2'>
                                    Email Address *
                                </label>
                                <input
                                    type='email'
                                    id='email'
                                    name='email'
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
                                    placeholder='your@email.com'
                                />
                            </div>
                        </div>

                        <div className='grid md:grid-cols-2 gap-6'>
                            <div>
                                <label htmlFor='phone' className='block text-sm font-medium text-slate-700 mb-2'>
                                    Phone Number
                                </label>
                                <input
                                    type='tel'
                                    id='phone'
                                    name='phone'
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
                                    placeholder='+91 9876543210'
                                />
                            </div>
                            <div>
                                <label htmlFor='company' className='block text-sm font-medium text-slate-700 mb-2'>
                                    Company Name
                                </label>
                                <input
                                    type='text'
                                    id='company'
                                    name='company'
                                    value={formData.company}
                                    onChange={handleChange}
                                    className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
                                    placeholder='Your company'
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor='message' className='block text-sm font-medium text-slate-700 mb-2'>
                                Message *
                            </label>
                            <textarea
                                id='message'
                                name='message'
                                required
                                rows={4}
                                value={formData.message}
                                onChange={handleChange}
                                className='w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none'
                                placeholder='Tell us about your requirements...'
                            />
                        </div>

                        <div className='text-center'>
                            <button
                                type='submit'
                                disabled={loading}
                                className='w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                            <p className='text-sm text-slate-500 mt-4'>
                                We typically respond within 24 hours during business days.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}