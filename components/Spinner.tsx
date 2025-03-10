import { Loader2 } from "lucide-react";

interface SpinnerProps {
  className?: string;
}

const Spinner = ({ className = "h-4 w-4" }: SpinnerProps) => {
  return <Loader2 className={`animate-spin ${className}`} />;
};

export default Spinner;