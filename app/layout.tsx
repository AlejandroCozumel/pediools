import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import ProvidersQuery from "@/providers/ProviderQuery";
import PremiumStatusProvider from "@/components/premium/PremiumStatusProvider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}
        >
          <ProvidersQuery>
            <PremiumStatusProvider>{children}</PremiumStatusProvider>
          </ProvidersQuery>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
