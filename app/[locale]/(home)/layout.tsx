// import Logo from "@/components/Logo";
// import ThemeSwitcher from "@/components/ThemeSwitcher";
import ShortDisclaimer from "@/components/ShortDisclaimer";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import React, { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Navbar />
      <main className="max-container">{children}</main>
      <ShortDisclaimer />
      <Footer />
    </>
  );
};

export default Layout;
