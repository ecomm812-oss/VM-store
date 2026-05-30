'use client'
import { useEffect, useState } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import AdminNavbar from "./AdminNavbar"
import AdminSidebar from "./AdminSidebar"

const AdminLayout = ({ children }) => {

    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchIsAdmin = async () => {
        try {
            const response = await fetch('/api/admin/auth')
            if (response.ok) {
                const data = await response.json()
                setIsAdmin(data.isAdmin === true)
            } else {
                setIsAdmin(false)
            }
        } catch (error) {
            console.error('Admin auth check failed:', error)
            setIsAdmin(false)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIsAdmin()
    }, [])

    return loading ? (
        <Loading />
    ) : isAdmin ? (
        <div className="flex flex-col h-screen">
            <AdminNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <AdminSidebar />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">Admin access required</h1>
            <p className="mt-3 text-slate-500">You must be logged in as an administrator to access this section.</p>
            <div className="mt-6 flex flex-col gap-3">
                <Link href="/admin/login" className="bg-blue-600 text-white px-6 py-2 rounded-full">
                    Admin Login
                </Link>
                <Link href="/" className="text-slate-700 px-6 py-2 rounded-full border border-slate-200">
                    Return Home
                </Link>
            </div>
        </div>
    )
}

export default AdminLayout