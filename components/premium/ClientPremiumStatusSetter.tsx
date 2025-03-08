'use client';
import { ReactNode } from 'react';
import { useEffect } from 'react';
import { useSubscriptionStore } from '@/stores/premiumStore';

interface ClientPremiumStatusSetterProps {
  children: ReactNode;
  initialPremiumStatus: boolean;
  initialPlan?: 'STARTER' | 'PRO' | 'ENTERPRISE' | null;
  initialStatus?: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING' | null;
  staffCount?: number | null;
}

export default function ClientPremiumStatusSetter({
  children,
  initialPremiumStatus,
  initialPlan = 'STARTER',
  initialStatus = 'ACTIVE',
  staffCount = null
}: ClientPremiumStatusSetterProps) {
  const { setSubscriptionInfo } = useSubscriptionStore();

  useEffect(() => {
    // If initialPlan is provided, use it directly
    if (initialPlan) {
      setSubscriptionInfo(
        initialStatus || 'ACTIVE',
        initialPlan,
        staffCount
      );
    }
    // If only initialPremiumStatus is provided (backward compatibility)
    else if (initialPremiumStatus) {
      // If premium is true but no plan specified, default to PRO
      setSubscriptionInfo(
        initialStatus || 'ACTIVE',
        'PRO',
        staffCount
      );
    } else {
      // If not premium and no plan specified, default to STARTER
      setSubscriptionInfo(
        initialStatus || 'ACTIVE',
        'STARTER',
        staffCount
      );
    }
  }, [initialPremiumStatus, initialPlan, initialStatus, staffCount, setSubscriptionInfo]);

  return <>{children}</>;
}