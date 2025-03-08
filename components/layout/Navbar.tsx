"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useSubscriptionStore } from "@/stores/premiumStore";
import UserMenu from "./UserMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";

const navigationItems = [
  {
    textKey: "premium",
    href: "/premium",
    premiumOnly: false,
    mobileOrder: 1,
  },
  {
    textKey: "dashboard",
    href: "/dashboard",
    premiumOnly: true,
    mobileOrder: 2,
  },
  {
    textKey: "patients",
    href: "/dashboard/patients",
    premiumOnly: true,
    mobileOrder: 3,
  },
  {
    textKey: "appointments",
    href: "/dashboard/appointments",
    premiumOnly: true,
    mobileOrder: 4,
  },
  {
    textKey: "calculations",
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
    <Image
      src="/pedimathLogo.svg"
      width={50}
      height={39}
      alt="Logo"
      className="fill-gray-800"
    />
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
        <span className="flex items-center h-[30px] text-gray-500 font-semibold">
          {isPremium ? `Premium: ${text}` : text}
        </span>
        <span className="flex items-center h-[30px] text-indigo-600 font-semibold">
          {isPremium ? `Premium: ${text}` : text}
        </span>
      </motion.div>
    </Link>
  );
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isPremium } = useSubscriptionStore();
  const { user, isLoaded } = useUser();
  const t = useTranslations("Navigation");

  // Initialize a state to track if the user has premium access
  const [hasAccess, setHasAccess] = useState(false);

  // Update the access state whenever the user or isPremium changes
  useEffect(() => {
    // Only show premium features if the user is logged in AND has premium subscription
    const userHasPremiumAccess = !!user && isPremium;
    setHasAccess(userHasPremiumAccess);
  }, [user, isPremium, isLoaded]);

  const getLocalizedItems = () => {
    return navigationItems.map((item) => ({
      ...item,
      text: t(item.textKey),
    }));
  };

  // Only show premium items if the user is logged in AND has premium subscription
  const visibleNavItems = getLocalizedItems().filter((item) =>
    hasAccess ? true : !item.premiumOnly
  );

  return (
    <nav className="bg-white border-b-[1px] border-gray-200 p-4">
      <div className="max-container flex items-center justify-between relative">
        <NavLeft setIsOpen={setIsOpen} navItems={visibleNavItems} />
        <NavRight />
        <NavMenu isOpen={isOpen} navItems={visibleNavItems} />
      </div>
    </nav>
  );
};

const NavLeft: React.FC<
  NavLeftProps & {
    navItems: ((typeof navigationItems)[0] & { text: string })[];
  }
> = ({ setIsOpen, navItems }) => {
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
      {navItems.map((item) => (
        <NavLink key={item.textKey} text={item.text} href={item.href} />
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
  navItems: ((typeof navigationItems)[0] & { text: string })[];
}> = ({ isOpen, navItems }) => {
  return (
    <motion.div
      variants={menuVariants}
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      className="z-10 absolute p-4 bg-white shadow-lg left-0 right-0 top-full origin-top flex flex-col gap-4"
    >
      {navItems
        .sort((a, b) => a.mobileOrder - b.mobileOrder)
        .map((item) => (
          <MenuLink key={item.textKey} text={item.text} href={item.href} />
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
          {isPremium ? `${text}` : text}
        </span>
        <span className="flex items-center h-[30px] text-indigo-600">
          {isPremium ? `${text}` : text}
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
