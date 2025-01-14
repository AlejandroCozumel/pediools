import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Check if it's the root path or any non-localized path
  if (pathname === '/' || !pathname.startsWith('/(en|es)/')) {
    // Rewrite the request to /en internally
    const newUrl = new URL(`/en${pathname}`, req.url);
    return NextResponse.rewrite(newUrl);
  }

  // Check if it's an API route
  if (pathname.startsWith('/api')) {
    if (isProtectedRoute(req)) await auth.protect();
    return;
  }

  // Apply next-intl middleware for other routes
  const handler = createMiddleware(routing);
  const result = await handler(req);

  // Apply Clerk protection for specific routes
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