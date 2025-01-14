"use client";
import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from "@/components/ui/toaster";
import ProvidersQuery from "@/providers/ProviderQuery";

export type IntlMessages = {
  [key: string]: any;
};

export default function ClerkInternationalized({
  children,
  messages,
  locale
}: {
  children: ReactNode;
  messages: IntlMessages;
  locale: string;
}) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ProvidersQuery>
        {children}
      </ProvidersQuery>
      <Toaster />
    </NextIntlClientProvider>
  );
}