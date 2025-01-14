// components/PremiumStatusProvider.tsx
import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import ClientPremiumStatusSetter from "@/components/premium/ClientPremiumStatusSetter";

export async function checkPremiumStatus() {
  const authResult = await auth();
  if (!authResult.userId) return false;

  const doctor = await prisma.doctor.findUnique({
    where: { clerkUserId: authResult.userId },
    select: {
      subscription: {
        select: {
          plan: true,
          status: true,
        },
      },
    },
  });

  return doctor?.subscription?.plan === "PREMIUM";
}

export default async function ServerPremiumStatusProvider({
  children,
}: {
  children: ReactNode;
}) {
  const isPremium = await checkPremiumStatus();

  return (
    <ClientPremiumStatusSetter initialPremiumStatus={isPremium}>
      {children}
    </ClientPremiumStatusSetter>
  );
}
