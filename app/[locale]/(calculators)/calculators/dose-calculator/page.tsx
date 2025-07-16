import { DoseForm } from "./DoseForm";
import { TooltipProvider } from '@/components/ui/tooltip';

export default function DoseCalculatorPage() {
  return (
    <TooltipProvider>
      <div className="container mx-auto py-6">
        <DoseForm />
      </div>
    </TooltipProvider>
  );
}