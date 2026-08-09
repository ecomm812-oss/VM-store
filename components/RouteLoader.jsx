'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function RouteLoader() {
    const pathname = usePathname()
    const prev = useRef(pathname)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (prev.current && prev.current !== pathname) {
            setLoading(true)
            const t = setTimeout(() => setLoading(false), 600)
            return () => clearTimeout(t)
        }
        prev.current = pathname
    }, [pathname])

    if (!loading) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl">
                <div className="w-12 h-12 rounded-full border-4 border-slate-300 border-t-green-500 animate-spin"></div>
                <p className="text-sm font-medium text-slate-700">Loading...</p>
            </div>
        </div>
    )
}
