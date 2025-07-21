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
      <div className="container mx-auto px-2 md:px-6 max-w-5xl">{children}</div>
      <ShortDisclaimer />
    </main>
  );
};

export default Layout;
