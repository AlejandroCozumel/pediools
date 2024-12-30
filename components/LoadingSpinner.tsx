import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "medical";
  centered?: boolean;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "medical",
  centered = false,
  fullScreen = false,
  className,
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border",
    md: "h-8 w-8 border-2",
    lg: "h-16 w-16 border-2",
    xl: "h-32 w-32 border-2",
  };

  const variantClasses = {
    primary: "border-blue-600",
    secondary: "border-gray-600",
    medical: "border-medical-600",
  };

  const containerClasses = cn(
    "flex items-center justify-center",
    fullScreen && "min-h-screen",
    centered && !fullScreen && "h-full w-full",
    className
  );

  const spinnerClasses = cn(
    "animate-spin rounded-full border-t-transparent",
    sizeClasses[size],
    variantClasses[variant]
  );

  const content = <div className={spinnerClasses} />;

  if (centered || fullScreen) {
    return <div className={containerClasses}>{content}</div>;
  }

  return content;
};

// Example usage with wrapper text
export const LoadingSpinnerWithText: React.FC<LoadingSpinnerProps & { text?: string }> = ({
  text = "Loading...",
  ...props
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner {...props} />
      <p className="text-medical-600 font-medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner;