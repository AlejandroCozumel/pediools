import LoadingSpinner from "@/components/LoadingSpinner";
import { Suspense } from "react";
import CDCChartInfant from "./CDCChartInfant";
import CDCChartHeightInfant from "./CDCChartHeightInfant";

const Charts = () => {
  return (
    <Suspense
      fallback={<LoadingSpinner centered variant="medical" size="lg" />}
    >
      <div className="container mx-auto my-4 md:my-6 flex flex-col gap-6">
        <h2 className="my-0 md:my-4 text-center bg-gradient-to-r from-medical-600 to-medical-800 bg-clip-text text-transparent text-lg md:text-2xl lg:text-4xl font-bold tracking-tight leading-tight py-2">
          United States CDC Growth Charts
          <span className="block text-sm md:text-base lg:text-xl text-medical-500 font-medium mt-1">
            Infant Growth Visualization (0-36 months)
          </span>
        </h2>
        <CDCChartInfant />
        <CDCChartHeightInfant />
      </div>
    </Suspense>
  );
};

export default Charts;
