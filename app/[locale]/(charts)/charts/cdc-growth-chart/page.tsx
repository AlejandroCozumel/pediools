"use client";
import React from "react";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import GrowthChartDisplay from "./GrowthChartDisplay";
import ProgressionTable from "@/components/ProgressionTable";
import { useSubscriptionStore } from "@/stores/premiumStore";
import ToggleViewChart from "@/components/ToggleViewChart";
// import SendChartNotification from "@/components/SendChartNotification ";

// Import the new client-side hook
import { useGrowthChartData } from "@/hooks/calculations/use-growth-chart-data";

const Charts = () => {
  const { isFullCurveView } = useSubscriptionStore();
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const calculationId = searchParams.get("calculationId");

  // Use the new client-side hook instead of the API call
  const { data, isLoading, isError, error } = useGrowthChartData(searchParams);

  if (isLoading || !data) {
    return <LoaderSpinnner />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-medical-600">
        {error instanceof Error ? error.message : "An error occurred"}
      </div>
    );
  }

  // Ensure data structure is valid before rendering charts
  if (
    !data ||
    !data.success ||
    !data.data ||
    !data.data.weight ||
    !data.data.height
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        Invalid chart data received.
      </div>
    );
  }

  return (
    <div className="my-4 md:my-6 flex flex-col gap-6 px-4">
      <div className="my-0 md:my-4 flex flex-col gap-1 text-center bg-gradient-to-r from-medical-800 to-medical-600 bg-clip-text text-transparent text-lg md:text-2xl lg:text-4xl font-bold tracking-tight leading-tight py-2">
        <h2>United States CDC Growth Charts</h2>
        <span className="block text-sm md:text-base lg:text-xl text-medical-500 font-medium mt-1">
          Child Growth Visualization (2-20 years)
        </span>
        <div className="flex justify-center mt-2">
          {/* <SendChartNotification
            chartData={data}
            patientId={searchParams.get("patientId")!}
            chartType="CDC Growth Chart"
            type="GROWTH_CDC"
          /> */}
        </div>
      </div>

      <ProgressionTable
        progressionData={data.progressionData}
        highlightCalculationId={calculationId || undefined}
      />

      <ToggleViewChart />

      {/* Render Weight Chart using reusable component */}
      <GrowthChartDisplay
        rawData={data} // Pass the full data object
        type="weight"
        isFullCurveView={isFullCurveView}
        yearRangeAround={isFullCurveView ? 18 : 4} // Adjusted range slightly
      />

      {/* Render Height Chart using reusable component */}
      <GrowthChartDisplay
        rawData={data} // Pass the full data object
        type="height"
        isFullCurveView={isFullCurveView}
        yearRangeAround={isFullCurveView ? 18 : 4} // Adjusted range slightly
      />
    </div>
  );
};

export default Charts;