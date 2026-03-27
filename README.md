# VM-Store E-commerce Platform

A modern e-commerce platform built with Next.js, featuring store management, payment processing, and admin dashboard.

## Features

- 🛒 Multi-vendor marketplace
- 🔐 Authentication with Clerk
- 💳 Payment processing with Razorpay
- 🖼️ Image management with ImageKit
- 📊 Admin dashboard
- 📱 Responsive design
- 🔒 Security headers and middleware

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Payments**: Razorpay
- **Images**: ImageKit
- **Background Jobs**: Inngest
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Clerk account
- Razorpay account
- ImageKit account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vm-store
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see Environment Variables section)

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Run database migrations:
```bash
npx prisma db push
```

6. Start development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Currency Symbol
NEXT_PUBLIC_CURRENCY_SYMBOL = '₹'

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"

# Database
DATABASE_URL="your_postgresql_connection_string"
DIRECT_URL="your_postgresql_direct_connection_string"

# Inngest (Background Jobs)
INNGEST_EVENT_URL="your_inngest_event_url"
INNGEST_SECRET_KEY="your_inngest_secret_key"

# Razorpay Payments
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"

# ImageKit
IMAGEKIT_PUBLIC_KEY="your_imagekit_public_key"
IMAGEKIT_PRIVATE_KEY="your_imagekit_private_key"
IMAGEKIT_ENDPOINT_URL="your_imagekit_endpoint_url"

# Admin Configuration
ADMIN_EMAILS="admin@example.com"
```

## Deployment to Vercel

### 1. Connect Repository

1. Push your code to GitHub/GitLab
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your repository

### 2. Configure Build Settings

The `vercel.json` file is already configured with:
- Build command: `prisma generate && next build`
- Framework: Next.js
- Function timeout: 30 seconds for API routes
- Region: Washington, D.C. (iad1)

### 3. Environment Variables

In your Vercel project settings, add all environment variables from your `.env` file:

1. Go to Project Settings → Environment Variables
2. Add each variable with the same names and values
3. Set environment to "Production" (and optionally "Preview" and "Development")

**Important Environment Variables:**
- `DATABASE_URL` - Your production PostgreSQL URL
- `CLERK_SECRET_KEY` - Clerk secret key
- `RAZORPAY_KEY_SECRET` - Razorpay secret key
- `IMAGEKIT_PRIVATE_KEY` - ImageKit private key
- `INNGEST_SECRET_KEY` - Inngest secret key

### 4. Database Setup

1. Ensure your Neon PostgreSQL database allows connections from Vercel
2. Run database migrations if needed:
```bash
npx prisma db push
```

### 5. Deploy

1. Click "Deploy" in Vercel
2. Monitor the build process
3. Your app will be available at the generated URL

### 6. Post-Deployment Setup

1. Update Clerk application settings with your production domain
2. Configure Razorpay webhook URLs
3. Set up ImageKit CORS settings
4. Configure Inngest webhooks

## Database Management

### Local Development
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# View database
npx prisma studio
```

### Production
For production database changes:
1. Make schema changes locally
2. Test migrations
3. Deploy to Vercel (build process runs `prisma generate`)
4. If needed, run migrations manually via Vercel functions

## API Routes

The application includes several API routes:

- `/api/admin/*` - Admin operations
- `/api/contact` - Contact form
- `/api/inngest` - Background job processing
- `/api/orders/*` - Order management
- `/api/products/*` - Product management
- `/api/store/*` - Store operations
- `/api/upload` - File uploads
- `/api/user/*` - User operations

## Security Features

- Clerk authentication middleware
- Security headers (CSP, XSS protection, etc.)
- Rate limiting
- Input validation
- SQL injection protection via Prisma

## Known Issues & Solutions

### Windows Build Issues with Next.js 16
If you encounter Turbopack-related build errors on Windows, the deployment is configured to disable Turbopack for Vercel builds. Local development should work fine, but if you need to test builds locally on Windows, you can:

1. Set environment variable: `TURBOPACK=0`
2. Or temporarily downgrade Next.js: `npm install next@15`

### Middleware Deprecation Warning
The project uses the older `middleware.ts` convention. Next.js 16 recommends using route handlers or the new middleware API. This doesn't affect functionality but may show deprecation warnings.
