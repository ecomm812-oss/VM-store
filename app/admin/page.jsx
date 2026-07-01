'use client'
import { dummyAdminDashboardData } from "@/assets/assets"
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import { CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon } from "lucide-react"
import { useEffect, useState } from "react"

export default function AdminDashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        products: 0,
        revenue: 0,
        orders: 0,
        stores: 0,
        allOrders: [],
        productDetails: [],
        orderDetails: []
    })

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.products, icon: ShoppingBasketIcon },
        { title: 'Total Revenue', value: currency + dashboardData.revenue, icon: CircleDollarSignIcon },
        { title: 'Total Orders', value: dashboardData.orders, icon: TagsIcon },
        { title: 'Total Stores', value: dashboardData.stores, icon: StoreIcon },
    ]

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/admin/dashboard')
            if (response.ok) {
                const data = await response.json()
                setDashboardData(data)
            } else {
                // Fallback to dummy data if API fails
                setDashboardData(dummyAdminDashboardData)
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
            setDashboardData(dummyAdminDashboardData)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500">
            <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>

            {/* Cards */}
            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-10 border border-slate-200 p-3 px-6 rounded-lg">
                            <div className="flex flex-col gap-3 text-xs">
                                <p>{card.title}</p>
                                <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className=" w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full" />
                        </div>
                    ))
                }
            </div>

            {/* Product & Order details */}
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr] my-10">
                <section className="border border-slate-200 rounded-xl p-6 bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">Total Products</h2>
                            <p className="text-sm text-slate-500">Latest products with store details</p>
                        </div>
                        <span className="text-slate-500 text-sm">{dashboardData.products} total</span>
                    </div>

                    {dashboardData.productDetails.length > 0 ? (
                        <div className="space-y-4">
                            {dashboardData.productDetails.map((product) => (
                                <div key={product.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 bg-slate-50">
                                    <div>
                                        <p className="font-medium text-slate-800">{product.name}</p>
                                        <p className="text-sm text-slate-500">{product.store?.name ?? 'Unknown store'}</p>
                                    </div>
                                    <div className="text-right text-sm text-slate-700">
                                        <p>{currency}{product.price.toFixed(2)}</p>
                                        <p className="text-slate-500">{new Date(product.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No product details available yet.</p>
                    )}
                </section>

                <section className="border border-slate-200 rounded-xl p-6 bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">Total Orders</h2>
                            <p className="text-sm text-slate-500">Recent orders with products and store names</p>
                        </div>
                        <span className="text-slate-500 text-sm">{dashboardData.orders} total</span>
                    </div>

                    {dashboardData.orderDetails.length > 0 ? (
                        <div className="space-y-4">
                            {dashboardData.orderDetails.map((order) => (
                                <div key={order.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-medium text-slate-800">Order #{order.id.slice(0, 8)}</p>
                                            <p className="text-sm text-slate-500">Store: {order.store?.name ?? 'Unknown store'}</p>
                                            <p className="text-sm text-slate-500">Status: {order.status}</p>
                                        </div>
                                        <div className="text-right text-sm font-semibold text-slate-700">
                                            <p>{currency}{order.total.toFixed(2)}</p>
                                            <p className="text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {(order.orderItems || []).map((item) => (
                                            <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3">
                                                <div>
                                                    <p className="text-sm text-slate-800">{item.product?.name ?? 'Unknown product'}</p>
                                                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="text-sm text-slate-700">{currency}{item.price.toFixed(2)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No order details available yet.</p>
                    )}
                </section>
            </div>

            {/* Area Chart */}
            <OrdersAreaChart allOrders={dashboardData.allOrders} />
        </div>
    )
}