// stores/premiumStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface PremiumState {
  isPremium: boolean;
  selectedPatient: Patient | null;
  setIsPremium: (status: boolean) => void;
  setPatient: (patient: Patient | null) => void;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      isPremium: false,
      selectedPatient: null,
      setIsPremium: (status) => set({ isPremium: status }),
      setPatient: (patient) => set({ selectedPatient: patient }),
    }),
    { name: 'premium-store' }
  )
);