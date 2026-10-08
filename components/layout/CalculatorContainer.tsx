"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function CalculatorContainer({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const wide = pathname.includes("/calculators/dose-calculator");
  return (
    <div className={`${wide ? "max-w-6xl" : "max-w-3xl"} mx-auto p-2 md:p-6`}>
      {children}
    </div>
  );
}
