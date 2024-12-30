import Navbar from "@/components/layout/Navbar";
import React, { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <main>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 md:px-0">
        {children}</div>
    </main>
  );
};

export default Layout;
