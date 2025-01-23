import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
console.log("hola")
  // Check if it's an API route
  if (pathname.startsWith('/api')) {
    if (isProtectedRoute(req)) await auth.protect();
    return;
  }

  // Apply next-intl middleware for all routes
  const handler = createMiddleware(routing);
  const result = await handler(req);

  // After next-intl middleware, check if it's a protected route
  if (isProtectedRoute(req)) await auth.protect();

  return result;
});

export const config = {
  matcher: [
    "/",
    "/(en|es)/:path*",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|^\\/$).*)",
    "/(api|trpc)(.*)",
  ],
};