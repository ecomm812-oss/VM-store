'use client'

import { useNavigation } from 'next/navigation'

export default function RouteLoader() {
    const navigation = useNavigation()

    if (navigation.state !== 'loading') return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl">
                <div className="w-12 h-12 rounded-full border-4 border-slate-300 border-t-green-500 animate-spin"></div>
                <p className="text-sm font-medium text-slate-700">Loading...</p>
            </div>
        </div>
    )
}
