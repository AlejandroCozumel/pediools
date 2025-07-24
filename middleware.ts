import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handler = createMiddleware(routing);
export default handler;

export const config = {
  matcher: [
    "/",
    "/(en|es)/:path*",
    // Exclude API routes from internationalization
    "/((?!_next|_vercel|api|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
