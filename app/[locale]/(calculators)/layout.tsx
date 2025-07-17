import Navbar from "@/components/layout/Navbar";
import React, { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <main>
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        {children}</div>
    </main>
  );
};

export default Layout;
