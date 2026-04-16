import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/metadata";
import { getDevProductById, shouldAllowDevProductFileFallback } from "@/lib/dev-product-fallback";

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
      // If database fails and we're in development, try fallback
      if (shouldAllowDevProductFileFallback()) {
        const devProduct = await getDevProductById(productId);
        if (devProduct) {
          return {
            title: `${devProduct.name} | Buy Online on VM Cart`,
            description: devProduct.description || `Buy ${devProduct.name} at great prices on VM Cart. Shop from independent sellers with fast shipping and easy returns.`,
          };
        }
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
