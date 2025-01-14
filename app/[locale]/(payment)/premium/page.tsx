import React from "react";
import LandingPage from "./LandingPage";
import { auth, currentUser } from '@clerk/nextjs/server';
// import CreateDoctorButton from './CreateDoctorButton';

async function Premium() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return <div>Please sign in to access premium features.</div>;
  }

  return (
    <div>
      <LandingPage />
      {/* <CreateDoctorButton /> */}
    </div>
  );
}

export default Premium;