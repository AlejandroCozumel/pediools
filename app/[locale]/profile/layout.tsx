// Layout component
"use client";
import Navbar from "@/components/layout/Navbar";
import React, { ReactNode, useEffect, useState } from "react";
import LoaderSpinnner from "@/components/LoaderSpinnner";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const [isMounted, setIsMounted] = useState(false);

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

  return (
    <>
      <Navbar />
      <main className="max-container">{children}</main>
    </>
  );
};

export default Layout;
