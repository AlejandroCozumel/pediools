import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-medical-600 text-white shadow hover:bg-medical-700 active:bg-medical-800",
        primary:
          "bg-medical-500 text-white shadow-sm hover:bg-medical-600 active:bg-medical-700",
        secondary:
          "bg-medical-100 text-medical-700 shadow-sm hover:bg-medical-200 active:bg-medical-300",
        outline:
          "border-2 border-medical-200 bg-transparent text-medical-700 shadow-sm hover:bg-medical-50 hover:border-medical-300 active:bg-medical-100",
        ghost:
          "text-medical-600 hover:bg-medical-50 hover:text-medical-700 active:bg-medical-100",
        link: "text-medical-600 underline-offset-4 hover:underline hover:text-medical-700",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
