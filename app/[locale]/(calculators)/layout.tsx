import Navbar from "@/components/layout/Navbar";
import React, { ReactNode } from "react";
import ShortDisclaimer from "@/components/ShortDisclaimer";
import Footer from "@/components/layout/Footer";
import CalculatorContainer from "@/components/layout/CalculatorContainer";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <main>
      <Navbar />
      <CalculatorContainer>{children}</CalculatorContainer>
      <ShortDisclaimer />
      <Footer />
    </main>
  );
};

export default Layout;
