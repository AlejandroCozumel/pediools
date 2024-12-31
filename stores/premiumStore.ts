import { create } from 'zustand';

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
  setIsPremium: (status: boolean) => void;
  setPatient: (patient: Patient | null) => void;
}

export const usePremiumStore = create<PremiumState>()((set) => ({
  isPremium: false,
  selectedPatient: null,
  setIsPremium: (status) => set({ isPremium: status }),
  setPatient: (patient) => set({ selectedPatient: patient }),
}));