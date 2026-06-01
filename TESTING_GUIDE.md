# VM-Store Testing Checklist

Use this checklist for ongoing testing and validation.

## Quick Test Commands

```bash
# Run these commands to verify the application

# 1. Validate schema
npx prisma validate

# 2. Build the application
npm run build

# 3. Run linter
npm run lint

# 4. Start dev server
npm run dev

# 5. Database operations
npx prisma db push        # Sync schema
npm run db:seed          # Seed initial data
npx prisma studio       # Visual database manager
```

## Pre-Deployment Checklist

- [ ] **Build Test**
  - [ ] Run `npm run build` - must complete without errors
  - [ ] Verify 43 pages compiled successfully
  - [ ] Check bundle sizes are reasonable

- [ ] **Database Test**
  - [ ] Run `npx prisma validate` - schema must be valid
  - [ ] Check `.env.local` has `DATABASE_URL` set
  - [ ] Verify database connection works
  - [ ] Run `npm run db:push` to sync schema

- [ ] **Code Quality**
  - [ ] Run `npm run lint` - only warnings allowed
  - [ ] Check for console.error logs (resolve if critical)
  - [ ] Review recent code changes

- [ ] **Component Test**
  - [ ] Open home page `/` in browser
  - [ ] Check navigation works
  - [ ] Test responsive design (mobile/tablet/desktop)
  - [ ] Verify images load correctly

- [ ] **API Test**
  - [ ] Test user authentication (Clerk login)
  - [ ] Create a test order
  - [ ] Verify database saves data correctly
  - [ ] Check error handling (try invalid requests)

- [ ] **Admin Features**
  - [ ] Access admin panel at `/admin`
  - [ ] Verify admin can approve stores
  - [ ] Check dashboard analytics
  - [ ] Test coupon management

- [ ] **Security**
  - [ ] Verify admin email gates are working
  - [ ] Check rate limiting on API endpoints
  - [ ] Confirm sensitive data is not logged
  - [ ] Test protected routes

## Testing Scenarios

### User Flow Test
```
1. Visit home page (/)
2. Sign up/login via Clerk
3. Browse products
4. Add product to cart
5. Proceed to checkout
6. Enter shipping address
7. Select payment method
8. Complete order
9. View order history
10. Leave product review
```

### Store Owner Flow Test
```
1. Create new store at /create-store
2. Add products from /store/add-product
3. Manage products at /store/manage-product
4. Check orders at /store/orders
5. View dashboard at /api/store/dashboard
```

### Admin Flow Test
```
1. Login to admin at /admin/login
2. View dashboard at /admin
3. Approve pending stores at /admin/approve
4. Manage coupons at /admin/coupons
5. Check store list at /admin/stores
```

## Common Issues & Solutions

### Build Fails
```bash
# Clear cache and reinstall
rm -r node_modules .next
npm install
npm run build
```

### Database Connection Error
```bash
# Verify environment variable
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin <<< "SELECT 1"

# Reset database (caution: destructive)
npm run db:push -- --force-reset
```

### Component Not Rendering
- Check browser console for errors
- Verify all imports are correct
- Check that env variables are set
- Test with `npm run dev` locally

### API Endpoint Errors
- Check request body format
- Verify authentication headers
- Test with curl/Postman
- Check server logs for details

## Performance Monitoring

```bash
# Run lighthouse audit
node lighthouse-audit.js

# Check build size
npm run build

# Analyze bundle
npm install -D webpack-bundle-analyzer
# Add to next.config.mjs and run build
```

## Database Maintenance

```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# View database in GUI
npx prisma studio

# Reset database (WARNING: destructive)
npm run db:push -- --force-reset

# Seed test data
npm run db:seed
```

## Monitoring & Logging

- Check `/admin/dashboard` for analytics
- Monitor error logs in production console
- Track failed API requests
- Set up email alerts for critical errors

## Release Checklist

Before deploying to production:

- [ ] All tests passing locally
- [ ] Build completes successfully
- [ ] No security warnings
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] Performance acceptable
- [ ] Error handling tested
- [ ] Rate limiting working
- [ ] Admin approval process tested
- [ ] Payment processing tested (sandbox)

---

Last Updated: June 1, 2026
