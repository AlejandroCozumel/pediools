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
      <main className="px-4 md:px-0 m-auto container">{children}</main>
    </>
  );
};

export default Layout;
