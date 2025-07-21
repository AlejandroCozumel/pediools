"use client";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Menu, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname } from 'next/navigation';

const navigationItems = [
  {
    textKey: "calculators",
    href: "/",
    mobileOrder: 0,
  },
  {
    textKey: "about",
    href: "/about",
    mobileOrder: 1,
  },
  {
    textKey: "faq",
    href: "/faq",
    mobileOrder: 2,
  },
  {
    textKey: "disclaimer",
    href: "/disclaimer",
    mobileOrder: 3,
  },
  {
    textKey: "contact",
    href: "/contact",
    mobileOrder: 4,
  },
];

interface NavLeftProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  navItems: ((typeof navigationItems)[0] & { text: string })[];
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
}> = ({ text, href }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`hidden lg:block h-[30px] overflow-hidden font-medium px-2 transition-colors duration-200 border-b-4 ${
        isActive
          ? 'border-indigo-600 text-indigo-700 bg-indigo-50 font-bold'
          : 'border-transparent text-gray-500 hover:text-indigo-600'
      }`}
    >
      <motion.div whileHover={{ y: -30 }}>
        <span className="flex items-center h-[30px] font-semibold">
          {text}
        </span>
        <span className="flex items-center h-[30px] text-indigo-600 font-semibold">
          {text}
        </span>
      </motion.div>
    </Link>
  );
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Navigation");
  const localizedItems = useMemo(() => {
    return navigationItems.map((item) => ({
      ...item,
      text: t(item.textKey),
    }));
  }, [t]);

  return (
    <nav className="bg-white border-b-[1px] border-gray-200 py-4">
      <div className="max-container flex items-center justify-between relative">
        <NavLeft setIsOpen={setIsOpen} navItems={localizedItems} />
        <NavRight />
        <NavMenu isOpen={isOpen} navItems={localizedItems} />
      </div>
    </nav>
  );
};

const NavLeft: React.FC<NavLeftProps> = ({ setIsOpen, navItems }) => {
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
      {/* <UserMenu /> */}
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
}> = ({ text, href }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`h-[30px] overflow-hidden font-medium text-lg flex items-start gap-2 px-2 transition-colors duration-200 border-b-4 ${
        isActive
          ? 'border-indigo-600 text-indigo-700 bg-indigo-50 font-bold'
          : 'border-transparent text-gray-500 hover:text-indigo-600'
      }`}
    >
      <span>
        <ChevronRight className="h-[30px] text-gray-950" />
      </span>
      <div className="w-full">
        <span className="flex items-center h-[30px]">
          {text}
        </span>
        <span className="flex items-center h-[30px] text-indigo-600">
          {text}
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
