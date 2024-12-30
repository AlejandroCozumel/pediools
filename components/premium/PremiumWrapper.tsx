'use client';
// components/premium/PremiumWrapper.tsx
import { useState } from 'react';
import PatientSelector from "@/components/premium/PatientSelector";
import { GrowthForm } from "@/app/(calculators)/growth-percentiles/GrowthForm";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
}

export default function PremiumWrapper() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  return (
    <div className="space-y-4">
      <PatientSelector
        onPatientSelect={(patient) => {
          setSelectedPatient(patient);
          // You can pass patient data to GrowthForm here
        }}
      />
      <GrowthForm />
    </div>
  );
}