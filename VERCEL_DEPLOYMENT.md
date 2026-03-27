# Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Repository Setup
- [ ] Push code to GitHub/GitLab repository
- [ ] Ensure all dependencies are in package.json
- [ ] Verify .env file is NOT committed (should be in .gitignore)

### 2. Database Configuration
- [ ] Neon PostgreSQL database is set up
- [ ] Database allows connections from Vercel IPs
- [ ] Test database connection locally
- [ ] Run `npx prisma db push` to ensure schema is up to date

### 3. Third-Party Services
- [ ] **Clerk**: Application created, publishable and secret keys obtained
- [ ] **Razorpay**: API keys obtained, webhook URLs configured
- [ ] **ImageKit**: Account created, public/private keys obtained, endpoint URL configured
- [ ] **Inngest**: Account created, event URL and secret key obtained

## Vercel Project Setup

### 1. Create Project
- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click "New Project"
- [ ] Import your repository
- [ ] Configure project settings:
  - Framework Preset: Next.js
  - Root Directory: ./ (leave default)
  - Build Command: `prisma generate && next build` (should be auto-detected)

### 2. Environment Variables
Add all environment variables in Vercel project settings:

```
NEXT_PUBLIC_CURRENCY_SYMBOL = '₹'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = your_clerk_publishable_key
CLERK_SECRET_KEY = your_clerk_secret_key
DATABASE_URL = your_production_database_url
DIRECT_URL = your_production_direct_database_url
INNGEST_EVENT_URL = your_inngest_event_url
INNGEST_SECRET_KEY = your_inngest_secret_key
NEXT_PUBLIC_RAZORPAY_KEY_ID = your_razorpay_key_id
RAZORPAY_KEY_ID = your_razorpay_key_id
RAZORPAY_KEY_SECRET = your_razorpay_key_secret
IMAGEKIT_PUBLIC_KEY = your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY = your_imagekit_private_key
IMAGEKIT_ENDPOINT_URL = your_imagekit_endpoint_url
ADMIN_EMAILS = your_admin_emails
```

### 3. Deploy
- [ ] Click "Deploy"
- [ ] Monitor build logs for any errors
- [ ] Wait for deployment to complete

## Post-Deployment Configuration

### 1. Update Service URLs
- [ ] **Clerk**: Update authorized domains/URLs to include production domain
- [ ] **Razorpay**: Configure webhook URLs to point to production API routes
- [ ] **ImageKit**: Update CORS settings for production domain
- [ ] **Inngest**: Update webhook URLs for production

### 2. Domain Setup (Optional)
- [ ] Add custom domain in Vercel project settings
- [ ] Configure DNS records
- [ ] Update all third-party services with custom domain

### 3. Testing
- [ ] Test user registration/login
- [ ] Test product creation and browsing
- [ ] Test payment flow
- [ ] Test admin dashboard
- [ ] Test image uploads
- [ ] Verify all API routes work

## Troubleshooting

### Common Issues:
1. **Build fails with Prisma error**: Ensure DATABASE_URL is set in environment variables
2. **Authentication not working**: Check Clerk keys and authorized domains
3. **Payments not processing**: Verify Razorpay keys and webhook URLs
4. **Images not loading**: Check ImageKit configuration and CORS settings
5. **Database connection errors**: Ensure Neon allows Vercel connections

### Useful Commands:
```bash
# Test build locally
TURBOPACK=0 npm run build

# Or on Windows PowerShell:
$env:TURBOPACK = "0"; npm run build

# Check for linting errors
npm run lint

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio
```

## Performance Optimization

- [ ] Enable Vercel Analytics
- [ ] Set up monitoring and error tracking
- [ ] Configure proper caching headers
- [ ] Optimize images with ImageKit
- [ ] Consider using Vercel Edge Functions for better performance