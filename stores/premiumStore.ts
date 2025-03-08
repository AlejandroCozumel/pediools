// stores/premiumStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define the Patient interface
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  gender: "male" | "female";
}

// Types for subscription state
type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "TRIALING" | null;
type PlanType = "FREE" | "STARTER" | "PRO" | "ENTERPRISE" | null;

interface SubscriptionState {
  // Core subscription data
  isPremium: boolean;
  isEnterprise: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: PlanType;
  staffCount: number | null;

  // Additional states
  isFullCurveView: boolean;
  selectedPatient: Patient | null;
  lastSyncTime: number; // Track when we last synced with the database

  // Actions
  setPatient: (patient: Patient | null) => void;
  toggleFullCurveView: () => void;
  setFullCurveView: (isFullCurve: boolean) => void;
  setSubscriptionInfo: (status: SubscriptionStatus, plan: PlanType, staffCount?: number | null) => void;
  resetSubscription: () => void;

  // New method to check if we need to sync
  needsSync: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      isEnterprise: false,
      selectedPatient: null,
      isFullCurveView: false,
      subscriptionStatus: null,
      subscriptionPlan: null,
      staffCount: null,
      lastSyncTime: 0, // Initialize to 0 to force first sync

      setPatient: (patient) => set({ selectedPatient: patient }),

      toggleFullCurveView: () => set((state) => ({
        isFullCurveView: !state.isFullCurveView,
      })),

      setFullCurveView: (isFullCurve) => set({
        isFullCurveView: isFullCurve,
      }),

      setSubscriptionInfo: (status, plan, staffCount = null) => set({
        subscriptionStatus: status,
        subscriptionPlan: plan,
        staffCount,
        lastSyncTime: Date.now(), // Update sync time when setting info
        isPremium:
          status === "ACTIVE" &&
          plan !== "FREE" &&
          (plan === "STARTER" || plan === "PRO" || plan === "ENTERPRISE"),
        isEnterprise: status === "ACTIVE" && plan === "ENTERPRISE",
      }),

      resetSubscription: () => set({
        isPremium: false,
        isEnterprise: false,
        subscriptionStatus: null,
        subscriptionPlan: null,
        staffCount: null,
        selectedPatient: null,
        lastSyncTime: Date.now(), // Update sync time when resetting
      }),

      // New method to check if we need to sync
      needsSync: () => {
        const state = get();
        const now = Date.now();
        // Sync if:
        // 1. Never synced before (lastSyncTime is 0)
        // 2. Last sync was more than 15 minutes ago
        // 3. We have no subscription plan but sync time is recent (error case)
        return (
          state.lastSyncTime === 0 ||
          now - state.lastSyncTime > 15 * 60 * 1000 || // 15 minutes
          (state.subscriptionPlan === null && now - state.lastSyncTime < 5000) // Recent error case
        );
      }
    }),
    {
      name: "subscription-storage",
      partialize: (state) => ({
        isPremium: state.isPremium,
        isEnterprise: state.isEnterprise,
        isFullCurveView: state.isFullCurveView,
        subscriptionStatus: state.subscriptionStatus,
        subscriptionPlan: state.subscriptionPlan,
        staffCount: state.staffCount,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);