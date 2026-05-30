// Global metadata configuration for SEO
export const siteMetadata = {
  siteName: "VM Cart",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://vmcart.com",
  locale: "en_US",
};

// Page-specific metadata
export const pageMetadata = {
  home: {
    title: "VM Cart | Online Shopping & Local Store Discovery",
    description: "Shop online from independent sellers and local stores. Find unique products from various categories at great prices on VM Cart.",
  },
  shop: {
    title: "Shop All Products | VM Cart - Marketplace for Local Stores",
    description: "Browse and discover products from independent sellers. Shop electronics, fashion, home decor, and more on VM Cart.",
  },
  cart: {
    title: "Shopping Cart | VM Cart",
    description: "Review your shopping cart, manage items, and proceed to checkout on VM Cart.",
  },
  createStore: {
    title: "Create Your Store | VM Cart - Start Selling Online",
    description: "Become a seller on VM Cart. Create your store, upload products, and start selling to customers nationwide.",
  },
  pricing: {
    title: "Pricing Plans | VM Cart - Store Seller Fees",
    description: "Check out flexible pricing plans for sellers on VM Cart. Find the plan that suits your business needs.",
  },
  subscription: {
    title: "Subscribe to Seller Plan | VM Cart",
    description: "Subscribe to a seller plan and start selling on VM Cart marketplace.",
  },
  contact: {
    title: "Contact Sales | VM Cart",
    description: "Get in touch with our sales team for enterprise solutions and custom pricing.",
  },
  orders: {
    title: "My Orders | VM Cart - Order History & Tracking",
    description: "View your order history, track shipments, and manage returns on VM Cart.",
  },
  product: (productName) => ({
    title: `${productName} | Buy Online on VM Cart`,
    description: `Buy ${productName} at great prices on VM Cart. Shop from independent sellers with fast shipping and easy returns.`,
  }),
  storeShop: (storeName) => ({
    title: `${storeName} Store | Shop Products on VM Cart`,
    description: `Visit ${storeName}'s store on VM Cart. Browse and shop quality products from this independent seller.`,
  }),
  orderTracking: (orderId) => ({
    title: `Order #${orderId} | Track Your Order on VM Cart`,
    description: `Track your order status, delivery updates, and other details for order #${orderId} on VM Cart.`,
  }),
  // Admin pages
  adminDashboard: {
    title: "Admin Dashboard | VM Cart Platform Management",
    description: "Manage stores, approvals, and platform analytics from the admin dashboard.",
  },
  adminApprovals: {
    title: "Store Approvals | VM Cart Admin Panel",
    description: "Review and approve new stores applying to become sellers on VM Cart.",
  },
  adminCoupons: {
    title: "Coupon Management | VM Cart Admin Panel",
    description: "Create, manage, and track promotional coupons on VM Cart.",
  },
  adminStores: {
    title: "Store Management | VM Cart Admin Panel",
    description: "View and manage all stores on the VM Cart platform.",
  },
  adminLogin: {
    title: "Admin Login | VM Cart",
    description: "Login to VM Cart admin panel for platform management.",
  },
  // Store pages
  storeDashboard: {
    title: "Seller Dashboard | VM Cart Store Management",
    description: "Manage your store, products, orders, and analytics on VM Cart.",
  },
  addProduct: {
    title: "Add New Product | VM Cart Seller Dashboard",
    description: "Upload and list new products in your VM Cart store.",
  },
  manageProducts: {
    title: "Manage Products | VM Cart Seller Dashboard",
    description: "Edit, update, and manage all your products on VM Cart.",
  },
  storeOrders: {
    title: "Store Orders | VM Cart Seller Dashboard",
    description: "View and manage orders received in your store on VM Cart.",
  },
};
