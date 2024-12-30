import { Suspense } from 'react';
import { GrowthForm } from "@/app/(calculators)/growth-percentiles/GrowthForm";
import PremiumFeature from "@/components/premium/PremiumFeature";
import PremiumWrapper from "@/components/premium/PremiumWrapper";

export default function GrowthPage() {
  return (
    <div className="container max-w-2xl mx-auto py-6">
      <Suspense fallback={<GrowthForm />}>
        <PremiumFeature
          fallback={<GrowthForm />}
        >
          <PremiumWrapper />
        </PremiumFeature>
      </Suspense>
    </div>
  );
}