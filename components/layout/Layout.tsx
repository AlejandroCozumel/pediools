import Navbar from "@/components/layout/Navbar";
import ShortDisclaimer from "@/components/ShortDisclaimer";
import React, { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => (
  <main>
    <Navbar />
    <div className="max-w-3xl mx-auto p-2 md:p-6">
      <ShortDisclaimer />
      {children}
    </div>
  </main>
);

export default Layout;