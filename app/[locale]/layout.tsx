import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import ProvidersQuery from "@/providers/ProviderQuery";
import ServerPremiumStatusProvider from "@/components/premium/ServerPremiumStatusProvider";
import { routing } from "@/i18n/routing";
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
          <NextIntlClientProvider messages={messages} locale={locale}>
            <ProvidersQuery>
              <ServerPremiumStatusProvider>
                {children}
              </ServerPremiumStatusProvider>
            </ProvidersQuery>
            <Toaster />
          </NextIntlClientProvider>
        </body>
      </html>
  );
}
