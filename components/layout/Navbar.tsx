'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { usePremiumStore } from '@/stores/premiumStore';
import UserMenu from './UserMenu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const navigationItems = [
  {
    textKey: "calculator",
    href: "/",
    premiumOnly: true,
    mobileOrder: 1,
  },
  {
    textKey: "calculator",
    href: "/",
    premiumOnly: false,
    mobileOrder: 1,
  },
  {
    textKey: "premium",
    href: "/premium",
    premiumOnly: false,
    mobileOrder: 2,
  },
  {
    textKey: "dashboard",
    href: "/dashboard",
    premiumOnly: true,
    mobileOrder: 3,
  },
  {
    textKey: "patients",
    href: "/dashboard/patients",
    premiumOnly: true,
    mobileOrder: 4,
  },
  {
    textKey: "appointments",
    href: "/dashboard/appointments",
    premiumOnly: true,
    mobileOrder: 5,
  },
  {
    textKey: "calculations",
    href: "/dashboard/calculations",
    premiumOnly: true,
    mobileOrder: 6,
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
  const { isPremium } = usePremiumStore();
  const t = useTranslations('Navigation');

  const getLocalizedItems = () => {
    return navigationItems.map(item => ({
      ...item,
      text: t(item.textKey)
    }));
  };

  const visibleNavItems = getLocalizedItems().filter((item) =>
    isPremium ? item.premiumOnly : !item.premiumOnly
  );

  return (
    <nav className="bg-white border-b-[1px] border-gray-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        <NavLeft setIsOpen={setIsOpen} />
        <NavRight />
        <NavMenu
          isOpen={isOpen}
          isPremium={isPremium}
          navigationItems={visibleNavItems}
        />
      </div>
    </nav>
  );
};

const NavLeft: React.FC<NavLeftProps> = ({ setIsOpen }) => {
  const { isPremium } = usePremiumStore();
  const t = useTranslations('Navigation');

  const getLocalizedItems = () => {
    return navigationItems.map(item => ({
      ...item,
      text: t(item.textKey)
    }));
  };

  const visibleNavItems = getLocalizedItems().filter((item) =>
    isPremium ? item.premiumOnly : !item.premiumOnly
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
  isPremium: boolean;
  navigationItems: (typeof navigationItems[0] & { text: string })[];
}> = ({ isOpen, navigationItems }) => {
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