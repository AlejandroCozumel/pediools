"use client";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { Menu, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePremiumStore } from "@/stores/premiumStore";
import UserMenu from "./UserMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const navigationItems = [
  {
    text: "Premium",
    href: "/premium",
    premiumOnly: false,
    mobileOrder: 1,
  },
  {
    text: "Dashboard",
    href: "/dashboard",
    premiumOnly: true,
    mobileOrder: 2,
  },
  {
    text: "Patients",
    href: "/dashboard/patients",
    premiumOnly: true,
    mobileOrder: 3,
  },
  {
    text: "Appointments",
    href: "/dashboard/appointments",
    premiumOnly: true,
    mobileOrder: 4,
  },
  {
    text: "Calculations",
    href: "/dashboard/calculations",
    premiumOnly: true,
    mobileOrder: 5,
  },
];

interface NavLeftProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Logo: React.FC = () => {
  return (
    <svg
      width="50"
      height="39"
      viewBox="0 0 50 39"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="fill-gray-800"
    >
      <path
        d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z"
        stopColor="#000000"
      ></path>
      <path
        d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z"
        stopColor="#000000"
      ></path>
    </svg>
  );
};

const NavLink: React.FC<{
  text: string;
  href: string;
  isPremium?: boolean;
}> = ({ text, href, isPremium }) => {
  return (
    <Link
      href={href}
      className="hidden lg:block h-[30px] overflow-hidden font-medium"
    >
      <motion.div whileHover={{ y: -30 }}>
        <span className="flex items-center h-[30px] text-gray-500">
          {isPremium ? `Premium: ${text}` : text}
        </span>
        <span className="flex items-center h-[30px] text-indigo-600">
          {isPremium ? `Premium: ${text}` : text}
        </span>
      </motion.div>
    </Link>
  );
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isPremium } = usePremiumStore();

  // Updated filtering logic
  const visibleNavItems = navigationItems.filter(
    (item) => isPremium ? item.premiumOnly : !item.premiumOnly
  );

  return (
    <nav className="bg-white p-4 border-b-[1px] border-gray-200 flex items-center justify-between relative">
      <NavLeft setIsOpen={setIsOpen} />
      <NavRight />
      <NavMenu
        isOpen={isOpen}
        isPremium={isPremium}
        navigationItems={visibleNavItems}
      />
    </nav>
  );
};

const NavLeft: React.FC<NavLeftProps> = ({ setIsOpen }) => {
  const { isPremium } = usePremiumStore();

  // Updated filtering logic
  const visibleNavItems = navigationItems.filter(
    (item) => isPremium ? item.premiumOnly : !item.premiumOnly
  );

  return (
    <div className="flex items-center gap-6">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="block lg:hidden text-gray-950 text-2xl"
        onClick={() => setIsOpen((pv) => !pv)}
      >
        <Menu />
      </motion.button>
      <Link href="/">
        <Logo />
      </Link>
      {visibleNavItems.map((item) => (
        <NavLink
          key={item.text}
          text={item.text}
          href={item.href}
        />
      ))}
    </div>
  );
};

const NavRight: React.FC = () => {
  return (
    <div className="flex items-center gap-4">
      <LanguageSwitcher />
      <UserMenu />
    </div>
  );
};

const NavMenu: React.FC<{
  isOpen: boolean;
  isPremium: boolean;
  navigationItems: typeof navigationItems;
}> = ({ isOpen, isPremium, navigationItems }) => {
  return (
    <motion.div
      variants={menuVariants}
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      className="z-10 absolute p-4 bg-white shadow-lg left-0 right-0 top-full origin-top flex flex-col gap-4"
    >
      {navigationItems
        .sort((a, b) => a.mobileOrder - b.mobileOrder)
        .map((item) => (
          <MenuLink
            key={item.text}
            text={item.text}
            href={item.href}
          />
        ))}
    </motion.div>
  );
};

const MenuLink: React.FC<{
  text: string;
  href: string;
  isPremium?: boolean;
}> = ({ text, href, isPremium }) => {
  return (
    <Link
      href={href}
      className="h-[30px] overflow-hidden font-medium text-lg flex items-start gap-2"
    >
      <span>
        <ChevronRight className="h-[30px] text-gray-950" />
      </span>
      <div className="w-full">
        <span className="flex items-center h-[30px] text-gray-500">
          {isPremium ? `Premium: ${text}` : text}
        </span>
        <span className="flex items-center h-[30px] text-indigo-600">
          {isPremium ? `Premium: ${text}` : text}
        </span>
      </div>
    </Link>
  );
};

const menuVariants = {
  open: {
    scaleY: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  closed: {
    scaleY: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.1,
    },
  },
};

export default Navbar;