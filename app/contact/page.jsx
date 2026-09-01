'use client'
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, MailIcon, PhoneIcon, MessageSquareIcon, CheckCircle2Icon, SparklesIcon } from 'lucide-react';

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
            <div className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(134,239,172,0.18),_transparent_35%),linear-gradient(180deg,#f8fffb_0%,#f1f5f9_100%)] flex items-center justify-center px-4 py-12'>
                <div className='max-w-md w-full mx-auto text-center'>
                    <div className='rounded-[32px] border border-emerald-200 bg-white/90 p-8 shadow-[0_30px_80px_rgba(9,120,78,0.12)] backdrop-blur-sm'>
                        <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
                            <CheckCircle2Icon className='h-8 w-8' />
                        </div>
                        <h1 className='mb-4 text-3xl font-black tracking-tight text-slate-900'>Message sent</h1>
                        <p className='mb-8 text-base leading-7 text-slate-600'>
                            Thank you for contacting us. Our sales team will get back to you within 24 hours.
                        </p>
                        <Link href='/' className='inline-flex items-center justify-center rounded-full bg-[rgb(5,223,114)] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-500'>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(134,239,172,0.16),_transparent_30%),linear-gradient(180deg,#f8fffb_0%,#f1f5f9_100%)] px-4 py-10 sm:px-6 lg:px-8'>
            <div className='mx-auto max-w-6xl'>
                <Link href='/pricing' className='mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900'>
                    <ArrowLeftIcon size={18} />
                    Back to Pricing
                </Link>

                <div className='grid gap-6 lg:grid-cols-[1fr_1.3fr]'>
                    <aside className='rounded-[32px] border border-emerald-100 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_100%)] p-6 shadow-[0_20px_60px_rgba(16,185,129,0.12)] sm:p-8'>
                        <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700'>
                            <SparklesIcon className='h-3.5 w-3.5' />
                            Contact sales
                        </div>

                        <h1 className='text-3xl font-black tracking-tight text-slate-900 sm:text-4xl'>Let’s build your next success story.</h1>
                        <p className='mt-4 max-w-md text-base leading-7 text-slate-600'>
                            Tell us about your business goals and we’ll help you choose the right setup, pricing, and support for your store.
                        </p>

                        <div className='mt-8 space-y-4'>
                            <div className='flex items-start gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4'>
                                <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600'>
                                    <MailIcon className='h-5 w-5' />
                                </div>
                                <div>
                                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>Email</p>
                                    <a href='mailto:sales@vmstore.com' className='mt-1 block text-base font-semibold text-slate-800 hover:text-emerald-700'>sales@vmstore.com</a>
                                </div>
                            </div>

                            <div className='flex items-start gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4'>
                                <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600'>
                                    <PhoneIcon className='h-5 w-5' />
                                </div>
                                <div>
                                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>Call</p>
                                    <a href='tel:+919876543210' className='mt-1 block text-base font-semibold text-slate-800 hover:text-emerald-700'>+91 98765 43210</a>
                                </div>
                            </div>

                            <div className='flex items-start gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4'>
                                <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600'>
                                    <MessageSquareIcon className='h-5 w-5' />
                                </div>
                                <div>
                                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>Response time</p>
                                    <p className='mt-1 text-base font-semibold text-slate-800'>Within 24 hours</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className='rounded-[32px] border border-slate-200 bg-white/90 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8'>
                        <div className='mb-8'>
                            <h2 className='text-2xl font-black tracking-tight text-slate-900'>Send us a message</h2>
                            <p className='mt-2 text-sm text-slate-500'>Share your requirements and we’ll reach out with the right solution.</p>
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-5'>
                            <div className='grid gap-5 md:grid-cols-2'>
                                <div>
                                    <label htmlFor='name' className='mb-2 block text-sm font-medium text-slate-700'>
                                        Full Name *
                                    </label>
                                    <input
                                        type='text'
                                        id='name'
                                        name='name'
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100'
                                        placeholder='Your full name'
                                    />
                                </div>

                                <div>
                                    <label htmlFor='email' className='mb-2 block text-sm font-medium text-slate-700'>
                                        Email Address *
                                    </label>
                                    <input
                                        type='email'
                                        id='email'
                                        name='email'
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100'
                                        placeholder='your@email.com'
                                    />
                                </div>
                            </div>

                            <div className='grid gap-5 md:grid-cols-2'>
                                <div>
                                    <label htmlFor='phone' className='mb-2 block text-sm font-medium text-slate-700'>
                                        Phone Number
                                    </label>
                                    <input
                                        type='tel'
                                        id='phone'
                                        name='phone'
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100'
                                        placeholder='+91 9876543210'
                                    />
                                </div>

                                <div>
                                    <label htmlFor='company' className='mb-2 block text-sm font-medium text-slate-700'>
                                        Company Name
                                    </label>
                                    <input
                                        type='text'
                                        id='company'
                                        name='company'
                                        value={formData.company}
                                        onChange={handleChange}
                                        className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100'
                                        placeholder='Your company'
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor='plan' className='mb-2 block text-sm font-medium text-slate-700'>
                                    Interested in
                                </label>
                                <select
                                    id='plan'
                                    name='plan'
                                    value={formData.plan}
                                    onChange={handleChange}
                                    className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100'
                                >
                                    <option value='enterprise'>Enterprise</option>
                                    <option value='startup'>Startup</option>
                                    <option value='growth'>Growth</option>
                                    <option value='custom'>Custom solution</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor='message' className='mb-2 block text-sm font-medium text-slate-700'>
                                    Message *
                                </label>
                                <textarea
                                    id='message'
                                    name='message'
                                    required
                                    rows={5}
                                    value={formData.message}
                                    onChange={handleChange}
                                    className='w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100'
                                    placeholder='Tell us about your requirements...'
                                />
                            </div>

                            <div className='pt-2'>
                                <button
                                    type='submit'
                                    disabled={loading}
                                    className='w-full rounded-full bg-[rgb(5,223,114)] px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60'
                                >
                                    {loading ? 'Sending...' : 'Send Message'}
                                </button>
                                <p className='mt-4 text-center text-sm text-slate-500'>
                                    We typically respond within 24 hours during business days.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}