import React from "react";
import { UserProfile } from "@clerk/nextjs";

const Account = () => {
  return (
    <div className="my-6 flex justify-center min-h-screen">
      <UserProfile routing="hash" />
    </div>
  );
};

export default Account;
