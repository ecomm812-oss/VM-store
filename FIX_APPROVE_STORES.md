# Fix: Approve Stores Not Showing Pending Requests

## Problem
The Approve Stores page is not displaying new pending store requests because the API is returning a 500 error: **"Publishable key not valid"**

## Root Cause
Your `.env.local` file has placeholder Clerk authentication keys:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here` ❌
- `CLERK_SECRET_KEY=your_clerk_secret_here` ❌

The middleware (`middleware.ts`) requires valid Clerk credentials to initialize, which is blocking all API requests.

## Solution

### Option 1: Add Real Clerk Keys (Recommended)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** section
4. Copy your **Publishable Key** and **Secret Key**
5. Update `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx
   ```
6. Restart your dev server: `npm run dev`

### Option 2: Use Clerk Test Keys (For Development)

If you're just testing locally, you can use Clerk's test environment:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Switch to **Test** environment 
3. Copy the test Publishable and Secret keys
4. Add them to `.env.local`

### Option 3: Temporary Workaround (For Testing)

If you don't have Clerk set up yet, you can temporarily modify the middleware to skip auth on API routes:

Edit `middleware.ts`:
```typescript
const isPublicRoute = createRouteMatcher([
  '/((?!admin|store).*)',
  '/admin/login',
  '/(api|trpc)(.*)',  // This makes /api routes public
])
```

This is already set in your middleware, so the issue is purely the invalid keys.

## How This Affects Store Approvals

1. User submits store → `POST /api/admin/stores` → Creates store with `status: 'pending'`
2. Admin visits `/admin/approve` page
3. Page calls `GET /api/admin/approve`
4. API validates admin via `isAdminUser()` function
5. Query returns pending stores with `status: 'pending'`
6. Page displays pending stores

**Currently:** Step 4 fails because Clerk can't validate the admin (invalid keys)

## Verification

Once you've added valid Clerk keys and restarted:
- The Approve page should show pending store requests
- Check browser DevTools → Network tab → `/api/admin/approve` should return `200 OK` with store data
- If still showing "No Application Pending", no pending stores exist yet (you need a user to submit one)
