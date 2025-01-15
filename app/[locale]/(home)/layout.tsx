// import Logo from "@/components/Logo";
// import ThemeSwitcher from "@/components/ThemeSwitcher";
import Navbar from "@/components/layout/Navbar";
import React, { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
    <Navbar />
    <main className="max-w-7xl px-4 mx-auto ">
      {children}
    </main>
    </>
  );
};

export default Layout;
