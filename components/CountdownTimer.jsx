'use client'
import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const CountdownTimer = ({ targetDate = '2026-08-09', title = 'Raksha Bandhan Sale Ends In' }) => {
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
            <div className='bg-gradient-to-br from-[#7a0b2d] to-[#d94b81] text-white rounded-lg px-4 py-3 min-w-20 text-center font-bold text-2xl shadow-lg transform hover:scale-110 transition-transform duration-300 animate-patrioticPulse'>
                {String(value).padStart(2, '0')}
            </div>
            <p className='text-slate-600 text-xs font-semibold mt-2 uppercase tracking-wider'>{label}</p>
        </div>
    )

    return (
        <div className='max-w-7xl mx-auto my-12 mx-6'>
            <div className='bg-gradient-to-r from-[#fff1f6] via-white to-[#fff5d6] rounded-3xl p-8 md:p-12 border-2 border-[#dca7b8] shadow-lg animate-fadeInUp'>
                <div className='flex items-center justify-center gap-3 mb-6'>
                    <Clock className='text-[#7a0b2d] animate-spin' size={28} style={{ animationDuration: '3s' }} />
                    <h3 className='text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#7a0b2d] to-[#d4a124] bg-clip-text text-transparent'>
                        {title}
                    </h3>
                    <Clock className='text-[#d4a124] animate-spin' size={28} style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                </div>

                <div className='flex justify-center gap-4 md:gap-8'>
                    <TimeBox value={timeLeft.days} label='Days' />
                    <div className='text-3xl font-bold text-[#7a0b2d] flex items-center'>:</div>
                    <TimeBox value={timeLeft.hours} label='Hours' />
                    <div className='text-3xl font-bold text-[#d4a124] flex items-center'>:</div>
                    <TimeBox value={timeLeft.minutes} label='Minutes' />
                    <div className='text-3xl font-bold text-[#7a0b2d] flex items-center'>:</div>
                    <TimeBox value={timeLeft.seconds} label='Seconds' />
                </div>

                <p className='text-center mt-8 text-slate-600 text-sm md:text-base'>
                    🎁 Limited time offer on all Raksha Bandhan specials! Don't miss out!
                </p>
            </div>
        </div>
    )
}

export default CountdownTimer
