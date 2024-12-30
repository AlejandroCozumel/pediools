"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

interface NavLeftProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavLinkProps {
  text: string;
}

interface NavMenuProps {
  isOpen: boolean;
}

interface MenuLinkProps {
  text: string;
}

const Navbar: React.FC = () => {
  return <FlipNav />;
};

const FlipNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <nav className="bg-white p-4 border-b-[1px] border-gray-200 flex items-center justify-between relative">
      <NavLeft setIsOpen={setIsOpen} />
      <NavRight />
      <NavMenu isOpen={isOpen} />
    </nav>
  );
};

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

const NavLeft: React.FC<NavLeftProps> = ({ setIsOpen }) => {
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
      <NavLink text="Solutions" />
      <NavLink text="Community" />
      <NavLink text="Pricing" />
      <NavLink text="Company" />
    </div>
  );
};

const NavLink: React.FC<NavLinkProps> = ({ text }) => {
  return (
    <a
      href="#"
      rel="nofollow"
      className="hidden lg:block h-[30px] overflow-hidden font-medium"
    >
      <motion.div whileHover={{ y: -30 }}>
        <span className="flex items-center h-[30px] text-gray-500">{text}</span>
        <span className="flex items-center h-[30px] text-indigo-600">
          {text}
        </span>
      </motion.div>
    </a>
  );
};

const NavRight: React.FC = () => {
  return (
    <div className="flex items-center gap-4">
      <UserButton afterSignOutUrl="/sign-in" />
    </div>
  );
};

const NavMenu: React.FC<NavMenuProps> = ({ isOpen }) => {
  return (
    <motion.div
      variants={menuVariants}
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      className="absolute p-4 bg-white shadow-lg left-0 right-0 top-full origin-top flex flex-col gap-4"
    >
      <MenuLink text="Solutions" />
      <MenuLink text="Community" />
      <MenuLink text="Pricing" />
      <MenuLink text="Company" />
    </motion.div>
  );
};

const MenuLink: React.FC<MenuLinkProps> = ({ text }) => {
  return (
    <motion.a
      variants={menuLinkVariants}
      rel="nofollow"
      href="#"
      className="h-[30px] overflow-hidden font-medium text-lg flex items-start gap-2"
    >
      <motion.span variants={menuLinkArrowVariants}>
        <ChevronRight className="h-[30px] text-gray-950" />
      </motion.span>
      <motion.div whileHover={{ y: -30 }}>
        <span className="flex items-center h-[30px] text-gray-500">{text}</span>
        <span className="flex items-center h-[30px] text-indigo-600">
          {text}
        </span>
      </motion.div>
    </motion.a>
  );
};

// Animation variants with proper typing
const menuVariants: {
  open: {
    scaleY: number;
    transition: {
      when: string;
      staggerChildren: number;
    };
  };
  closed: {
    scaleY: number;
    transition: {
      when: string;
      staggerChildren: number;
    };
  };
} = {
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

const menuLinkVariants: {
  open: {
    y: number;
    opacity: number;
  };
  closed: {
    y: number;
    opacity: number;
  };
} = {
  open: {
    y: 0,
    opacity: 1,
  },
  closed: {
    y: -10,
    opacity: 0,
  },
};

const menuLinkArrowVariants: {
  open: {
    x: number;
  };
  closed: {
    x: number;
  };
} = {
  open: {
    x: 0,
  },
  closed: {
    x: -4,
  },
};

export default Navbar;
