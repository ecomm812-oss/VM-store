'use client'

import React, { useState } from 'react'
import Title from './Title'

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    const trimmedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!trimmedEmail) {
      setMessage('Please enter your email address.')
      setStatus('error')
      return
    }

    if (!emailRegex.test(trimmedEmail)) {
      setMessage('Please enter a valid email address.')
      setStatus('error')
      return
    }

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      if (!response.ok) {
        try {
          const error = await response.json()
          setMessage(error.error || 'Failed to subscribe. Please try again.')
        } catch {
          setMessage('Failed to subscribe. Please try again.')
        }
        setStatus('error')
      } else {
        const data = await response.json()
        setMessage(data.message || 'Thanks for subscribing!')
        setStatus('success')
        setEmail('')
      }
    } catch (error) {
      console.error('[Newsletter] Subscription failed', error)
      setMessage('Something went wrong. Please try again later.')
      setStatus('error')
    }
  }

  return (
    <div className='flex flex-col items-center mx-4 my-36 animate-fadeInUp'>
      <Title
        title='Join Newsletter'
        description='Subscribe to get exclusive deals, new arrivals, and insider updates delivered straight to your inbox every week.'
        visibleButton={false}
      />

      <form onSubmit={handleSubmit} className='flex w-full max-w-xl my-10'>
        <div className='flex bg-slate-100 text-sm p-1 rounded-full w-full border-2 border-white ring ring-slate-200 transition-all duration-300 hover:ring-2 hover:ring-green-300 focus-within:ring-2 focus-within:ring-green-300'>
          <input
            className='flex-1 pl-5 outline-none bg-transparent transition-colors duration-300'
            type='email'
            placeholder='Enter your email address'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label='Newsletter email'
            required
            suppressHydrationWarning
          />
          <button
            type='submit'
            disabled={status === 'loading'}
            className='font-medium bg-green-500 text-white px-7 py-3 rounded-full hover:scale-103 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {status === 'loading' ? 'Saving...' : 'Get Updates'}
          </button>
        </div>
      </form>

      {message && (
        <p className={`mt-2 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

export default Newsletter