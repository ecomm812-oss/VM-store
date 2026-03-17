import { clerkMiddleware, redirectToSignIn } from "@clerk/nextjs";

export default clerkMiddleware({
  afterAuth: (req) => {
    // Redirect to sign in if user is not authenticated
    if (!req.auth.userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    return;
  },
});

export const config = {
  matcher: [
    // Protect API routes and any pages that require auth
    "/api/:path*",
    "/store/:path*",
    "/admin/:path*",
    "/orders",
  ],
};
