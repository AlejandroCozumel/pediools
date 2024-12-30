import LoadingSpinner from "@/components/LoadingSpinner";
import { Suspense } from "react";
import CDCChart from "./CDCChart";
import CDCChartHeight from "./CDCChartHeight";

const Charts = () => {
  return (
    <Suspense
      fallback={<LoadingSpinner centered variant="medical" size="lg" />}
    >
      <div className="container mx-auto my-4 md:my-6 flex flex-col gap-6">
        <h2 className="my-0 md:my-4 text-center bg-gradient-to-r from-medical-800 to-medical-600 bg-clip-text text-transparent text-lg md:text-2xl lg:text-4xl font-bold tracking-tight leading-tight py-2">
          United States CDC Growth Charts
          <span className="block text-sm md:text-base lg:text-xl text-medical-500 font-medium mt-1">
            Child Growth Visualization (2-20 years)
          </span>
        </h2>
        <CDCChart />
        <CDCChartHeight />
      </div>
    </Suspense>
  );
};

export default Charts;
