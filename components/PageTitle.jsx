'use client'
import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'

const PageTitle = ({ heading, text, path = "/", linkText }) => {
    return (
        <div className="my-4 sm:my-6 px-3 sm:px-0">
            <h2 className="text-lg sm:text-2xl font-semibold">{heading}</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-2">
                <p className="text-xs sm:text-sm text-slate-600">{text}</p>
                <Link href={path} className="flex items-center gap-1 text-green-500 text-xs sm:text-sm whitespace-nowrap">
                    {linkText} <ArrowRightIcon size={12} />
                </Link>
            </div>
        </div>
    )
}

export default PageTitle