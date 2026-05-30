import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }) {
  try {
    const { orderId } = params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true }
    });

    if (!order) {
      return {
        title: "Order Not Found | VM Cart",
        description: "The order you are looking for is not available.",
      };
    }

    return {
      title: `Order #${orderId} | Track Your Order on VM Cart`,
      description: `Track your order status, delivery updates, and other details for order #${orderId} on VM Cart.`,
    };
  } catch (error) {
    return {
      title: "Track Order | VM Cart",
      description: "Track your order on VM Cart.",
    };
  }
}

export default function OrderLayout({ children }) {
  return children;
}
