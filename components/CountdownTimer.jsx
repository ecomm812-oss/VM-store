'use client'
import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const CountdownTimer = ({ targetDate = '2026-08-15', title = 'Independence Day Sale Ends In' }) => {
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
            <div className='bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-lg px-4 py-3 min-w-20 text-center font-bold text-2xl shadow-lg transform hover:scale-110 transition-transform duration-300 animate-patrioticPulse'>
                {String(value).padStart(2, '0')}
            </div>
            <p className='text-slate-600 text-xs font-semibold mt-2 uppercase tracking-wider'>{label}</p>
        </div>
    )

    return (
        <div className='max-w-7xl mx-auto my-12 mx-6'>
            <div className='bg-gradient-to-r from-orange-50 via-white to-green-50 rounded-3xl p-8 md:p-12 border-2 border-orange-300 shadow-lg animate-fadeInUp'>
                <div className='flex items-center justify-center gap-3 mb-6'>
                    <Clock className='text-orange-600 animate-spin' size={28} style={{ animationDuration: '3s' }} />
                    <h3 className='text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent'>
                        {title}
                    </h3>
                    <Clock className='text-green-600 animate-spin' size={28} style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                </div>

                <div className='flex justify-center gap-4 md:gap-8'>
                    <TimeBox value={timeLeft.days} label='Days' />
                    <div className='text-3xl font-bold text-orange-500 flex items-center'>:</div>
                    <TimeBox value={timeLeft.hours} label='Hours' />
                    <div className='text-3xl font-bold text-green-600 flex items-center'>:</div>
                    <TimeBox value={timeLeft.minutes} label='Minutes' />
                    <div className='text-3xl font-bold text-orange-500 flex items-center'>:</div>
                    <TimeBox value={timeLeft.seconds} label='Seconds' />
                </div>

                <p className='text-center mt-8 text-slate-600 text-sm md:text-base'>
                    🇮🇳 Limited time offer on all Independence Day specials! Don't miss out!
                </p>
            </div>
        </div>
    )
}

export default CountdownTimer
