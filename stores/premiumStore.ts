import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
}

interface PremiumState {
  isPremium: boolean;
  selectedPatient: Patient | null;
  isFullCurveView: boolean;  // Property for chart view mode
  setIsPremium: (status: boolean) => void;
  setPatient: (patient: Patient | null) => void;
  toggleFullCurveView: () => void;  // Method to toggle view
  setFullCurveView: (isFullCurve: boolean) => void;  // Method to set specific view
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      isPremium: false,
      selectedPatient: null,
      isFullCurveView: false,  // Default to focused view
      setIsPremium: (status) => set({ isPremium: status }),
      setPatient: (patient) => set({ selectedPatient: patient }),
      toggleFullCurveView: () => set((state) => ({
        isFullCurveView: !state.isFullCurveView
      })),
      setFullCurveView: (isFullCurve) => set({
        isFullCurveView: isFullCurve
      }),
    }),
    {
      name: 'premium-storage', // name of the item in the storage
      partialize: (state) => ({
        isPremium: state.isPremium,
        isFullCurveView: state.isFullCurveView
      }),
    }
  )
);