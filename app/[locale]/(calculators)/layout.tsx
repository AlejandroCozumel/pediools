import Navbar from "@/components/layout/Navbar";
import React, { ReactNode } from "react";
import ShortDisclaimer from "@/components/ShortDisclaimer";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <main>
      <Navbar />
      <div className="max-w-3xl mx-auto p-2 md:p-6">{children}</div>
      <ShortDisclaimer />
    </main>
  );
};

export default Layout;
