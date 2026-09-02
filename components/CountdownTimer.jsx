'use client'
import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const CountdownTimer = ({ targetDate = '2026-08-09', title = 'Sale ends soon' }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        const calculateTimeLeft = () => {
            const targetTime = new Date(targetDate).getTime()
            const currentTime = new Date().getTime()
            const difference = targetTime - currentTime

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                })
            } else {
                setTimeLeft({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                })
            }
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)
        return () => clearInterval(timer)
    }, [targetDate])

    if (!mounted) {
        return null
    }

    const TimeBox = ({ value, label }) => (
        <div className='flex flex-col items-center animate-fadeInUp'>
            <div className='bg-slate-900 text-white rounded-xl sm:rounded-2xl px-2.5 py-2 sm:px-4 sm:py-3 min-w-[52px] sm:min-w-[78px] text-center font-black text-lg sm:text-2xl shadow-[0_14px_30px_rgba(15,23,42,0.18)] border border-slate-800'>
                {String(value).padStart(2, '0')}
            </div>
            <p className='text-slate-500 text-[8px] sm:text-[10px] md:text-xs font-semibold mt-1.5 sm:mt-2 uppercase tracking-[0.18em] sm:tracking-[0.22em]'>{label}</p>
        </div>
    )

    return (
        <div className='max-w-7xl mx-auto my-8 sm:my-12 px-4 sm:px-6'>
            <div className='bg-white rounded-[24px] sm:rounded-[30px] p-5 sm:p-8 md:p-12 border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.06)] animate-fadeInUp'>
                <div className='flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
                    <div className='flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700'>
                        <Clock className='animate-spin' size={18} style={{ animationDuration: '3s' }} />
                    </div>
                    <h3 className='text-base sm:text-2xl md:text-3xl font-black text-slate-900 text-center leading-tight break-words'>
                        {title}
                    </h3>
                </div>

                <div className='flex justify-center items-center gap-1.5 sm:gap-3 md:gap-6'>
                    <TimeBox value={timeLeft.days} label='Days' />
                    <div className='text-xl sm:text-3xl font-bold text-violet-600 flex items-center'>:</div>
                    <TimeBox value={timeLeft.hours} label='Hours' />
                    <div className='text-xl sm:text-3xl font-bold text-violet-600 flex items-center'>:</div>
                    <TimeBox value={timeLeft.minutes} label='Minutes' />
                    <div className='text-xl sm:text-3xl font-bold text-violet-600 flex items-center'>:</div>
                    <TimeBox value={timeLeft.seconds} label='Seconds' />
                </div>

                <p className='text-center mt-8 text-slate-600 text-sm md:text-base'>
                    🎁 Grab the best deals before they’re gone.
                </p>
            </div>
        </div>
    )
}

export default CountdownTimer
