# VM-Store API Reference

Complete API endpoint documentation for VM-Store e-commerce platform.

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication
All endpoints (except public ones) require Clerk authentication. Include the Clerk session cookie with requests.

---

## USER ENDPOINTS

### Get Current User
```http
GET /api/user
```
**Description**: Fetch current authenticated user's profile  
**Auth**: Required (Clerk)  
**Response**:
```json
{
  "id": "cuid_string",
  "clerkId": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "image": "https://...",
  "cart": "{}"
}
```

### Create/Update User
```http
POST /api/user
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "image": "https://avatar-url"
}
```
**Description**: Create or update user record  
**Auth**: Required  
**Status Codes**: 200 (created), 400 (invalid), 401 (unauthorized)

### Manage Addresses
```http
POST /api/user/address
Content-Type: application/json

{
  "name": "Home",
  "email": "john@example.com",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip": "10001",
  "country": "USA",
  "phone": "+1234567890"
}
```
**Description**: Add or update shipping address  
**Auth**: Required  
**Returns**: Address object with ID

---

## PRODUCT ENDPOINTS

### Get All Products
```http
GET /api/products?search=shirt&category=clothing&page=1&limit=20
```
**Description**: Fetch products with optional filtering  
**Auth**: Optional  
**Query Parameters**:
- `search`: Product name search
- `category`: Filter by category
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sortBy`: 'newest', 'price-low', 'price-high'
- `minPrice`: Minimum price
- `maxPrice`: Maximum price

**Response**:
```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "T-Shirt",
      "description": "Cotton t-shirt",
      "mrp": 1000,
      "price": 799,
      "images": ["url1", "url2"],
      "category": "clothing",
      "inStock": true,
      "storeId": "store_123"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### Get Store Products
```http
GET /api/products/store?storeId=store_123
```
**Description**: Get all products from a specific store  
**Auth**: Optional  
**Query**: `storeId` (required)

---

## STORE ENDPOINTS

### Create Store
```http
POST /api/store/create
Content-Type: application/json

{
  "storeName": "My Store",
  "description": "Store description",
  "storeEmail": "store@example.com",
  "image": "https://logo-url"
}
```
**Description**: Create new seller store  
**Auth**: Required  
**Notes**: Admin approval required before store goes live

### Get Store Info
```http
GET /api/store/info?storeId=store_123
```
**Description**: Get store details  
**Auth**: Optional

### Get Public Store
```http
GET /api/store/shop/[username]
```
**Description**: Get public store view  
**Auth**: None (public)

### Store Dashboard
```http
GET /api/store/dashboard
```
**Description**: Seller's store analytics and stats  
**Auth**: Required (store owner only)

### Subscription Management
```http
POST /api/store/subscription
Content-Type: application/json

{
  "plan": "premium",
  "billingCycle": "monthly"
}
```
**Description**: Update store subscription  
**Auth**: Required

---

## ORDER ENDPOINTS

### Get User Orders
```http
GET /api/orders?status=DELIVERED&limit=10
```
**Description**: Fetch user's order history  
**Auth**: Required  
**Query Parameters**:
- `status`: Filter by status (ORDER_PLACED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- `limit`: Number of orders (default: 20)
- `page`: Page number

**Response**:
```json
{
  "orders": [
    {
      "id": "order_123",
      "total": 2999,
      "status": "DELIVERED",
      "userId": "user_123",
      "storeId": "store_123",
      "addressId": "addr_123",
      "isPaid": true,
      "paymentMethod": "RAZORPAY",
      "createdAt": "2024-01-15T10:30:00Z",
      "orderItems": [
        {
          "id": "item_123",
          "productId": "prod_123",
          "quantity": 2,
          "price": 1499.50,
          "selectedSize": "M"
        }
      ]
    }
  ]
}
```

### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "addressId": "addr_123",
  "paymentMethod": "RAZORPAY",
  "items": [
    {
      "productId": "prod_123",
      "quantity": 2,
      "selectedSize": "M"
    }
  ],
  "couponCode": "SAVE20"
}
```
**Description**: Create new order  
**Auth**: Required  
**Notes**: Triggers payment flow

### Get Order Details
```http
GET /api/orders/[orderId]
```
**Description**: Get specific order details  
**Auth**: Required (owner only)

### Cancel Order
```http
POST /api/orders/cancel
Content-Type: application/json

{
  "orderId": "order_123",
  "reason": "Changed my mind"
}
```
**Description**: Cancel pending order  
**Auth**: Required  
**Status**: Only ORDER_PLACED orders can be cancelled

### Get Store Orders
```http
GET /api/orders/store?status=PROCESSING
```
**Description**: Get seller's orders  
**Auth**: Required (store owner only)

### Track Order
```http
GET /api/orders/store/tracking?orderId=order_123
```
**Description**: Get real-time tracking info  
**Auth**: Required

---

## RATING & REVIEW ENDPOINTS

### Submit Product Review
```http
POST /api/rating
Content-Type: application/json

{
  "productId": "prod_123",
  "orderId": "order_123",
  "rating": 5,
  "review": "Excellent product!"
}
```
**Description**: Post product review  
**Auth**: Required  
**Rating**: 1-5 stars  
**Notes**: User must have purchased the product

### Get Product Ratings
```http
GET /api/products/[productId]/ratings
```
**Description**: Get all reviews for a product  
**Auth**: Optional

---

## PAYMENT ENDPOINTS

### Razorpay Integration
```
Razorpay is integrated via server-side verification
Order creation is handled by POST /api/orders
Signature verification is handled by POST /api/payments/verify-payment
```

**Supported Payment Methods**:
- `RAZORPAY`: Online payment gateway
- `COD`: Cash on delivery

### Verify Razorpay Payment
```http
POST /api/payments/verify-payment
Content-Type: application/json

{
  "orderId": "<order-id>",
  "razorpayPaymentId": "<razorpay_payment_id>",
  "razorpayOrderId": "<razorpay_order_id>",
  "razorpaySignature": "<razorpay_signature>"
}
```

**Description**: Verify Razorpay signature server-side and mark the order paid.
**Auth**: Required

---

## ADMIN ENDPOINTS

### Admin Dashboard
```http
GET /api/admin/dashboard
```
**Description**: Admin analytics and statistics  
**Auth**: Required (admin only)

### Get All Stores
```http
GET /api/admin/stores?status=PENDING
```
**Description**: View all registered stores  
**Auth**: Required (admin only)  
**Query Parameters**:
- `status`: PENDING, APPROVED, REJECTED

### Approve/Reject Store
```http
POST /api/admin/approve
Content-Type: application/json

{
  "storeId": "store_123",
  "approved": true,
  "reason": "Approval reason"
}
```
**Description**: Approve or reject store application  
**Auth**: Required (admin only)

### Manage Coupons
```http
POST /api/admin/coupons
Content-Type: application/json

{
  "code": "SAVE20",
  "description": "20% off coupon",
  "discount": 20,
  "forNewUser": true,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```
**Description**: Create or update coupon  
**Auth**: Required (admin only)

### Admin Auth
```http
POST /api/admin/auth
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "***"
}
```
**Description**: Admin login (alternative auth)  
**Notes**: Primary auth is via Clerk

---

## UTILITY ENDPOINTS

### Upload Image
```http
POST /api/upload/image
Content-Type: multipart/form-data

file: <binary>
folder: products | stores | profiles (optional)
```
**Description**: Upload product/store/profile images  
**Auth**: Required  
**Returns**: 
```json
{
  "url": "https://cloudinary-url/image.jpg",
  "publicId": "vm-store/image123"
}
```

### Contact Form
```http
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Support Request",
  "message": "I need help with..."
}
```
**Description**: Submit contact form  
**Auth**: Optional

### Newsletter Subscription
```http
POST /api/newsletter
Content-Type: application/json

{
  "email": "user@example.com"
}
```
**Description**: Subscribe to newsletter  
**Auth**: Optional

### Inngest Workflow Trigger
```http
POST /api/inngest
Content-Type: application/json

{
  "event": "order.shipped",
  "data": { "orderId": "order_123" }
}
```
**Description**: Trigger background workflows  
**Auth**: Required (internal)

---

## ERROR RESPONSES

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "status": 400,
  "details": "Additional error details (optional)"
}
```

### Common Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing auth
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server error

---

## Rate Limiting

API endpoints have rate limiting enabled:
- **User endpoints**: 60 requests/minute
- **Product endpoints**: 100 requests/minute
- **Order endpoints**: 30 requests/minute
- **Admin endpoints**: 50 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1234567890
```

---

## Testing with cURL

### Get Current User
```bash
curl -X GET "http://localhost:3000/api/user" \
  -H "Cookie: __session=your_clerk_cookie"
```

### Create Product
```bash
curl -X POST "http://localhost:3000/api/products" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=your_clerk_cookie" \
  -d '{
    "name": "Product Name",
    "price": 999,
    "category": "clothing"
  }'
```

### Create Order
```bash
curl -X POST "http://localhost:3000/api/orders" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=your_clerk_cookie" \
  -d '{
    "addressId": "addr_123",
    "items": [{"productId": "prod_123", "quantity": 1}],
    "paymentMethod": "RAZORPAY"
  }'
```

---

## Webhook Events (Inngest)

Available workflow events:
- `order.created` - New order placed
- `order.paid` - Payment confirmed
- `order.shipped` - Order shipped
- `order.delivered` - Order delivered
- `order.cancelled` - Order cancelled
- `store.approved` - Store approved by admin
- `product.listed` - New product listed
- `user.registered` - New user registered

---

**Last Updated**: June 1, 2026  
**API Version**: 1.0.0
