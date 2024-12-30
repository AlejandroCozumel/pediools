'use client';
import { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePremiumStore } from '@/stores/premiumStore';

interface ClientPremiumStatusSetterProps {
  children: ReactNode;
  initialPremiumStatus: boolean;
}

export default function ClientPremiumStatusSetter({
  children,
  initialPremiumStatus
}: ClientPremiumStatusSetterProps) {
  const { setIsPremium } = usePremiumStore();

  useEffect(() => {
    setIsPremium(initialPremiumStatus);
  }, [initialPremiumStatus, setIsPremium]);

  return <>{children}</>;
}