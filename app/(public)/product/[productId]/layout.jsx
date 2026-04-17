import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/metadata";

function isProductColumnTypeMismatch(error) {
  const message = error?.message || ''
  return message.includes("Expected a string in column 'images'") ||
    message.includes("Expected a string in column 'sizes'") ||
    message.includes('malformed array literal') ||
    message.includes('Expected a string in column')
}

export async function generateMetadata({ params }) {
  try {
    const { productId } = await params;

    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, description: true }
      });

      if (product) {
        return {
          title: `${product.name} | Buy Online on VM Cart`,
          description: product.description || `Buy ${product.name} at great prices on VM Cart. Shop from independent sellers with fast shipping and easy returns.`,
        };
      }
    } catch (error) {
      if (isProductColumnTypeMismatch(error)) {
        return {
          title: "Product Not Found | VM Cart",
          description: "The product you are looking for is not available.",
        };
      }
    }

    return {
      title: "Product Not Found | VM Cart",
      description: "The product you are looking for is not available.",
    };
  } catch (error) {
    return {
      title: "Product | VM Cart",
      description: "Browse products on VM Cart.",
    };
  }
}

export default function ProductLayout({ children }) {
  return children;
}
