// Layout component
"use client";
import Navbar from "@/components/layout/Navbar";
import React, { ReactNode, useEffect, useState } from "react";
import { usePremiumStore } from "@/stores/premiumStore";
import UnauthorizedAccess from "@/components/UnauthorizedAccess";
import LoaderSpinnner from "@/components/LoaderSpinnner";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const { isPremium } = usePremiumStore();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsMounted(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  if (!isMounted) {
    return (
      <>
        <Navbar />
        <LoaderSpinnner />
      </>
    );
  }

  if (!isPremium) {
    return (
      <>
        <Navbar />
        <UnauthorizedAccess />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="px-4 m-auto container">{children}</main>
    </>
  );
};

export default Layout;
