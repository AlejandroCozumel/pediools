'use client'

import React from 'react';
import { useRouter } from 'next/navigation';

const CreateDoctorButton: React.FC = () => {
  const router = useRouter();

  const handleClick = async () => {
    try {
      const response = await fetch('/api/create-doctor', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create doctor');
      }

      const data = await response.json();
      console.log("Doctor created:", data.doctor);
      router.refresh(); // Refresh the page to show updated data
    } catch (error) {
      console.error("Error creating doctor:", error);
    }
  };

  return (
    <button onClick={handleClick}>Create Doctor Profile</button>
  );
};

export default CreateDoctorButton;