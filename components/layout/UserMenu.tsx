"use client";

import { useState, useRef, useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { CircleUserRound } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MenuItemProps {
  onClick: () => void;
  label: string;
  active?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ onClick, label, active }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "px-4 py-3 transition font-semibold cursor-pointer",
        active
          ? "bg-medical-50 text-medical-600 hover:bg-medical-100"
          : "hover:bg-neutral-100 text-gray-700"
      )}
    >
      {label}
    </div>
  );
};

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const menuItems = [
    {
      label: "My Profile",
      path: "/profile/myprofile",
      onClick: () => {
        router.push("/profile/myprofile");
        setIsOpen(false);
      },
    },
    {
      label: "My Account",
      path: "/profile/account",
      onClick: () => {
        router.push("/profile/account");
        setIsOpen(false);
      },
    },
    {
      label: "My Subscription",
      path: "/profile/billing",
      onClick: () => {
        router.push("/profile/billing");
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="
          border
          border-neutral-200
          flex
          flex-row
          items-center
          gap-2
          rounded-full
          cursor-pointer
          hover:shadow-[0_2px_4px_rgba(0,0,0,0.18)]
          transition
          h-[40px]
          w-[40px]
        "
      >
        <div className="hidden md:block">
          {user ? (
            <Avatar className="h-[40px] w-[40px]">
              <AvatarImage src={user?.imageUrl ?? undefined} />
              <AvatarFallback className="bg-medical-100 text-medical-700">
                {getInitials(user?.fullName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-[40px] w-[40px] bg-gray-100">
              <AvatarFallback>
                <CircleUserRound className="h-[40px] w-[40px] text-slate-300" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="
              absolute
              rounded-xl
              shadow-[0_2px_16px_rgba(0,0,0,0.12)]
              w-[40vw]
              md:w-[200px]
              bg-white
              overflow-hidden
              right-0
              top-14
              text-sm
              z-50
            "
          >
            <div className="flex flex-col cursor-pointer">
              {user ? (
                <>
                  <div className="px-4 py-3 font-semibold border-b text-medical-700">
                    {user.fullName}
                  </div>
                  {menuItems.map((item) => (
                    <MenuItem
                      key={item.label}
                      label={item.label}
                      onClick={item.onClick}
                      active={pathname.includes(item.path)}
                    />
                  ))}
                  <div className="border-b" />
                  <MenuItem label="Sign out" onClick={handleSignOut} />
                </>
              ) : (
                <>
                  <MenuItem
                    label="Sign up"
                    onClick={() => {
                      router.push("/sign-up");
                      setIsOpen(false);
                    }}
                  />
                  <MenuItem
                    label="Sign in"
                    onClick={() => {
                      router.push("/sign-in");
                      setIsOpen(false);
                    }}
                  />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
