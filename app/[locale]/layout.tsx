import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import ProvidersQuery from "@/providers/ProviderQuery";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PediCalc - Pediatric Calculator Suite",
  description:
    "Professional pediatric calculation tools for healthcare providers",
  icons: {
    icon: [
      { url: "/pedimathLogo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/pedimathLogo.svg",
  },
};

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Fetch messages for the current locale
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}
      >
        <Script
          src="https://scripts.simpleanalyticscdn.com/latest.js"
          strategy="afterInteractive"
        />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ProvidersQuery>{children}</ProvidersQuery>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
