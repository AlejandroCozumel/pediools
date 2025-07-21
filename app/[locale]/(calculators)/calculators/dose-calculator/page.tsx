export const runtime = 'edge';
import { DoseMethodSelector } from "./DoseMethodSelector";
import { TooltipProvider } from '@/components/ui/tooltip';

export default function DoseCalculatorPage() {
  return (
    <TooltipProvider>
      <div className="container mx-auto">
        <DoseMethodSelector />
      </div>
    </TooltipProvider>
  );
}