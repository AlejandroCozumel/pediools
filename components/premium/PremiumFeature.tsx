// components/premium/PremiumFeature.tsx
import { ReactNode } from 'react';
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

interface PremiumFeatureProps {
  children: ReactNode;
  fallback?: ReactNode;
}

async function getPremiumStatus() {
  const authResult = await auth();
  if (!authResult.userId) return false;

  const doctor = await prisma.doctor.findUnique({
    where: { clerkUserId: authResult.userId },
    select: {
      subscription: {
        select: {
          plan: true,
          status: true
        }
      }
    }
  });

  return doctor?.subscription?.plan === 'PREMIUM' &&
         doctor?.subscription?.status === 'ACTIVE';
}

export default async function PremiumFeature({ children, fallback }: PremiumFeatureProps): Promise<JSX.Element> {
  const isPremium = await getPremiumStatus();
  if (!isPremium) {
    return fallback as JSX.Element || null;
  }

  return <>{children}</>;
}



// interface PremiumFeatureProps {
//   children: ReactNode;
//   fallback?: ReactNode;
// }

// async function checkIfDoctor() {
//   const authResult = await auth();

//   if (!authResult.userId) return false;

//   const doctor = await prisma.doctor.findUnique({
//     where: { clerkUserId: authResult.userId },
//   });

//   // console.log("Doctor found?:", !!doctor);  // Debug log
//   return !!doctor; // Returns true if doctor exists, false if not
// }

// export default async function PremiumFeature({ children, fallback }: PremiumFeatureProps): Promise<JSX.Element> {
//   const isDoctor = await checkIfDoctor();

//   if (!isDoctor) {
//     return fallback as JSX.Element || null;
//   }

//   return <>{children}</>;
// }