import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
}

type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING';
type PlanType = 'STARTER' | 'PRO' | 'ENTERPRISE';

interface SubscriptionState {
  // Properties reflecting subscription status
  isPremium: boolean;
  isEnterprise: boolean;
  selectedPatient: Patient | null;
  isFullCurveView: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlan: PlanType | null;
  staffCount: number | null;

  // Actions to update state
  setPatient: (patient: Patient | null) => void;
  toggleFullCurveView: () => void;
  setFullCurveView: (isFullCurve: boolean) => void;
  setSubscriptionInfo: (status: SubscriptionStatus, plan: PlanType, staffCount?: number | null) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      isPremium: false,
      isEnterprise: false,
      selectedPatient: null,
      isFullCurveView: false,
      subscriptionStatus: null,
      subscriptionPlan: null,
      staffCount: null,

      setPatient: (patient) => set({ selectedPatient: patient }),

      toggleFullCurveView: () => set((state) => ({
        isFullCurveView: !state.isFullCurveView
      })),

      setFullCurveView: (isFullCurve) => set({
        isFullCurveView: isFullCurve
      }),

      setSubscriptionInfo: (status, plan, staffCount = null) => set({
        subscriptionStatus: status,
        subscriptionPlan: plan,
        staffCount,
        isPremium: plan === 'PRO' || plan === 'ENTERPRISE',
        isEnterprise: plan === 'ENTERPRISE'
      }),
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        isPremium: state.isPremium,
        isEnterprise: state.isEnterprise,
        isFullCurveView: state.isFullCurveView,
        subscriptionStatus: state.subscriptionStatus,
        subscriptionPlan: state.subscriptionPlan,
        staffCount: state.staffCount
      }),
    }
  )
);

// Utility function to check feature access based on plan
export function hasFeatureAccess(
  feature: 'GROWTH_CHARTS' | 'PDF_REPORTS' | 'EMAIL_REPORTS' | 'PATIENT_TRACKING' |
          'DATA_EXPORT' | 'CUSTOM_BRANDING' | 'STAFF_MANAGEMENT' | 'MULTI_LOCATION' | 'CUSTOM_INTEGRATIONS',
  plan: PlanType | null
): boolean {
  if (!plan) return false;

  // Features available to all plans
  const baseFeatures = ['GROWTH_CHARTS', 'PATIENT_TRACKING'];
  if (baseFeatures.includes(feature)) return true;

  // Features available to PRO and ENTERPRISE
  const proFeatures = ['PDF_REPORTS', 'EMAIL_REPORTS', 'DATA_EXPORT', 'CUSTOM_BRANDING', 'STAFF_MANAGEMENT'];
  if ((plan === 'PRO' || plan === 'ENTERPRISE') && proFeatures.includes(feature)) return true;

  // Features only available to ENTERPRISE
  const enterpriseFeatures = ['MULTI_LOCATION', 'CUSTOM_INTEGRATIONS'];
  if (plan === 'ENTERPRISE' && enterpriseFeatures.includes(feature)) return true;

  return false;
}

// Utility function to get staff limit based on plan
export function getStaffLimit(plan: PlanType | null): number {
  if (!plan) return 0;

  switch (plan) {
    case 'STARTER':
      return 0;
    case 'PRO':
      return 5;
    case 'ENTERPRISE':
      return Infinity; // No limit for enterprise
    default:
      return 0;
  }
}