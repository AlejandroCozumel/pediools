"use client";
import React from "react";
import DoctorProfileForm from "./ProfileForm";
import { useDoctorProfile } from "@/hooks/use-doctor-profile";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import { usePremiumStore } from "@/stores/premiumStore";
import UnauthorizedAccess from "@/components/UnauthorizedAccess";

const Profile = () => {
  const { profile, isLoading, error, saveProfile } = useDoctorProfile();
  const { isPremium } = usePremiumStore();

  // Add error handling
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-medical-600">
        Something went wrong loading your profile.
      </div>
    );
  }

  // Loading state

  if (isLoading) {
    return <LoaderSpinnner />;
  }

  if (!isPremium) {
    return (
        <UnauthorizedAccess />
    );
  }

  return (
    <div>
      <DoctorProfileForm
        profile={profile}
        saveProfile={saveProfile}
        isSubmitting={saveProfile.isPending}
      />
    </div>
  );
};

export default Profile;
