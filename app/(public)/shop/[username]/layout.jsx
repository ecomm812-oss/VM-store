import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }) {
  try {
    const { username } = params;
    const store = await prisma.store.findUnique({
      where: { username: username },
      select: { storeName: true, description: true }
    });

    if (!store) {
      return {
        title: "Store Not Found | VM Cart",
        description: "The store you are looking for is not available.",
      };
    }

    return {
      title: `${store.storeName} | Shop on VM Cart`,
      description: store.description || `Visit ${store.storeName}'s store on VM Cart. Browse and shop quality products from this independent seller.`,
    };
  } catch (error) {
    return {
      title: "Store | VM Cart",
      description: "Browse from independent sellers on VM Cart.",
    };
  }
}

export default function StoreShopLayout({ children }) {
  return children;
}
