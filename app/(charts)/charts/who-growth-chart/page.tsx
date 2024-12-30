import LoadingSpinner from "@/components/LoadingSpinner";
import { Suspense } from "react";
import WHOChart from "./WHOChart";
import WHOChartHeight from "./WHOChartHeight";

const Charts = () => {
  return (
    <Suspense
      fallback={<LoadingSpinner centered variant="medical" size="lg" />}
    >
      <div className="container mx-auto my-4 md:my-6 flex flex-col gap-6">
        <h2 className="my-0 md:my-4 text-center bg-gradient-to-r from-medical-600 to-medical-800 bg-clip-text text-transparent text-lg md:text-2xl lg:text-4xl font-bold tracking-tight leading-tight py-2">
          WHO Growth Standards
          <span className="block text-sm md:text-base lg:text-xl text-medical-500 font-medium mt-1">
            Infant Growth Visualization (0-24 months)
          </span>
        </h2>
        <WHOChart />
        <WHOChartHeight />
      </div>
    </Suspense>
  );
};

export default Charts;
