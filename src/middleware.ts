import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define routes that should be accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/',                  // Root route - handles its own auth redirects
  '/login(.*)',         // Your sign-in page
  '/api/(.*)',          // Clerk and other API routes
]);

export default clerkMiddleware(async (auth, req) => {
  // If the request is not for a public route, protect it.
  // Unauthenticated users will be redirected to the sign-in page.
  if (!isPublicRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn();
    }
  }
});

// This matcher is from the Clerk documentation (z-clerk.md)
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
