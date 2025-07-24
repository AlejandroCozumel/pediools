import Navbar from "@/components/layout/Navbar";
import React, { ReactNode } from "react";
import ShortDisclaimer from "@/components/ShortDisclaimer";
import Footer from "@/components/layout/Footer";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <main>
      <Navbar />
      <div className="max-w-3xl mx-auto p-2 md:p-6">{children}</div>
      <ShortDisclaimer />
      <Footer />
    </main>
  );
};

export default Layout;
