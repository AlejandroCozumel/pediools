// providers/SubscriptionProvider.tsx
'use client';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSubscriptionStore } from '@/stores/premiumStore';
import { getSubscriptionByUserId } from '@/app/actions/subscription';
import { PlanType, SubscriptionStatus } from '@prisma/client';

// Create context
const SubscriptionContext = createContext<{
  isLoading: boolean; // Indicate if initial load is happening
  isSyncing: boolean; // Indicate if background sync is happening
}>({
  isLoading: true,
  isSyncing: false,
});

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const {
    resetSubscription,
    setSubscriptionInfo,
    needsSync,
    subscriptionPlan
  } = useSubscriptionStore();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const initialSyncComplete = useRef(false);

  // Function to sync subscription data
  const syncSubscription = async (isInitialSync = false) => {
    if (isInitialSync) {
      setIsLoading(true);
    } else {
      setIsSyncing(true);
    }

    try {
      // If no user, reset subscription
      if (!user) {
        resetSubscription();
        return;
      }

      // Get subscription data from database
      const result = await getSubscriptionByUserId();

      if (result.success && result.subscription) {
        // We need to cast the strings to enum values
        const status = result.subscription.status as SubscriptionStatus;
        const plan = result.subscription.plan as PlanType;

        // Update store with subscription data
        setSubscriptionInfo(
          status,
          plan,
          result.subscription.staffCount
        );
      } else {
        // No valid subscription or error
        console.warn('Subscription sync issue:', result.error);
        resetSubscription();
      }
    } catch (error) {
      console.error('Error syncing subscription:', error);
      resetSubscription();
    } finally {
      if (isInitialSync) {
        setIsLoading(false);
        initialSyncComplete.current = true;
      } else {
        setIsSyncing(false);
      }
    }
  };

  // Effect for initial sync when user loads
  useEffect(() => {
    if (!isUserLoaded) return;

    // User just loaded, do initial sync
    if (!initialSyncComplete.current) {
      syncSubscription(true);
    }
  }, [isUserLoaded, user]);

  // Effect for periodic checks if sync is needed
  useEffect(() => {
    if (!isUserLoaded || !initialSyncComplete.current) return;

    // Check if we need to sync and user is authenticated
    if (user && typeof needsSync === 'function' && !isSyncing) {
      if (needsSync()) {
        syncSubscription(false);
      }
    }

    // If user signed out, make sure subscription is reset
    if (!user && subscriptionPlan !== null) {
      resetSubscription();
    }

    // Set up a periodic check for subscription updates
    const interval = setInterval(() => {
      if (user && typeof needsSync === 'function' && needsSync() && !isSyncing) {
        syncSubscription(false);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [isUserLoaded, user, needsSync, isSyncing, subscriptionPlan, resetSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        isLoading,
        isSyncing,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

// Custom hook to use subscription context
export const useSubscription = () => useContext(SubscriptionContext);