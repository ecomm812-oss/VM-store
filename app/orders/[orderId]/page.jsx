import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const revalidate = 0

export default async function OrderDetailsPage({ params }) {
    const { orderId } = await params

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true,
            address: true
        }
    })

    if (!order) {
        return (
            <div className="mx-6 py-16">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-2xl font-semibold">Order not found</h1>
                    <p className="text-slate-500 mt-3">The order you are looking for could not be found.</p>
                    <Link href="/orders" className="text-blue-500 mt-6 inline-block">Back to orders</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-6 py-16">
            <div className="max-w-5xl mx-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
                <p className="text-slate-500 mt-2">Status: {order.status}</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div>
                        <h2 className="font-medium">Delivery address</h2>
                        <p className="text-sm text-slate-600 mt-2">{order.address?.addressLine || 'N/A'}</p>
                    </div>
                    <div>
                        <h2 className="font-medium">Total</h2>
                        <p className="text-sm text-slate-600 mt-2">₹{order.totalAmount || 0}</p>
                    </div>
                </div>
                <div className="mt-8">
                    <h2 className="font-medium">Items</h2>
                    <ul className="mt-3 space-y-2">
                        {order.items?.map((item) => (
                            <li key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                                {item.name} × {item.quantity}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
