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
type PlanType = 'FREE' | 'PREMIUM';

interface PremiumState {
  isPremium: boolean;
  selectedPatient: Patient | null;
  isFullCurveView: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlan: PlanType | null;
  setIsPremium: (status: boolean) => void;
  setPatient: (patient: Patient | null) => void;
  toggleFullCurveView: () => void;
  setFullCurveView: (isFullCurve: boolean) => void;
  setSubscriptionInfo: (status: SubscriptionStatus, plan: PlanType) => void;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      isPremium: false,
      selectedPatient: null,
      isFullCurveView: false,
      subscriptionStatus: null,
      subscriptionPlan: null,
      setIsPremium: (status) => set({ isPremium: status }),
      setPatient: (patient) => set({ selectedPatient: patient }),
      toggleFullCurveView: () => set((state) => ({
        isFullCurveView: !state.isFullCurveView
      })),
      setFullCurveView: (isFullCurve) => set({
        isFullCurveView: isFullCurve
      }),
      setSubscriptionInfo: (status, plan) => set({
        subscriptionStatus: status,
        subscriptionPlan: plan,
        isPremium: plan === 'PREMIUM'
      }),
    }),
    {
      name: 'premium-storage',
      partialize: (state) => ({
        isPremium: state.isPremium,
        isFullCurveView: state.isFullCurveView,
        subscriptionStatus: state.subscriptionStatus,
        subscriptionPlan: state.subscriptionPlan
      }),
    }
  )
);