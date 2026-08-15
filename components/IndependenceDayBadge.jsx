'use client'
import React from 'react'
import { Sparkles, TrendingUp, Award } from 'lucide-react'

const IndependenceDayBadge = ({ type = 'special', discount = null, position = 'top-right' }) => {
    const badges = {
        special: {
            bg: 'bg-gradient-to-r from-orange-500 to-red-500',
            icon: Sparkles,
            text: 'Independence Special',
            textColor: 'text-white'
        },
        trending: {
            bg: 'bg-gradient-to-r from-yellow-400 to-orange-500',
            icon: TrendingUp,
            text: 'Trending',
            textColor: 'text-white'
        },
        bestseller: {
            bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
            icon: Award,
            text: 'Best Seller',
            textColor: 'text-white'
        },
        discount: {
            bg: 'bg-red-600',
            icon: null,
            text: `${discount}% OFF`,
            textColor: 'text-white'
        }
    }

    const badge = badges[type] || badges.special
    const Icon = badge.icon

    const positionClasses = {
        'top-left': 'top-2 left-2',
        'top-right': 'top-2 right-2',
        'bottom-left': 'bottom-2 left-2',
        'bottom-right': 'bottom-2 right-2'
    }

    return (
        <div className={`absolute ${positionClasses[position]} z-20 animate-bounce`}>
            <div className={`${badge.bg} ${badge.textColor} px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg transform hover:scale-110 transition-transform duration-300`}>
                {Icon && <Icon size={14} className="animate-spin" style={{ animationDuration: '3s' }} />}
                <span>{badge.text}</span>
            </div>
        </div>
    )
}

export default IndependenceDayBadge
