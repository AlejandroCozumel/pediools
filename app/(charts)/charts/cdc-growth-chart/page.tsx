"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import CDCChart from "./CDCChart";
import CDCChartHeight from "./CDCChartHeight";

// Define the fetch function
const fetchGrowthChartData = async (searchParams: URLSearchParams) => {
  const weightData = searchParams.get("weightData");
  const heightData = searchParams.get("heightData");
  const patientId = searchParams.get("patientId");

  if (!weightData || !heightData) {
    throw new Error("Weight and height data are required");
  }

  const { data } = await axios.get("/api/charts/cdc-growth-chart", {
    params: {
      weightData,
      heightData,
      ...(patientId && { patientId }),
    },
  });

  if (!data.success) {
    throw new Error(data.error || "Failed to load chart data");
  }

  return data;
};

const Charts = () => {
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["growthChartData", searchParams.toString()],
    queryFn: () => fetchGrowthChartData(searchParams),
    enabled: typeof window !== "undefined",
  });

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

  return (
    <div className="container mx-auto my-4 md:my-6 flex flex-col gap-6">
      <h2 className="my-0 md:my-4 text-center bg-gradient-to-r from-medical-800 to-medical-600 bg-clip-text text-transparent text-lg md:text-2xl lg:text-4xl font-bold tracking-tight leading-tight py-2">
        United States CDC Growth Charts
        <span className="block text-sm md:text-base lg:text-xl text-medical-500 font-medium mt-1">
          Child Growth Visualization (2-20 years)
        </span>
      </h2>
      <CDCChart data={data} />
      <CDCChartHeight data={data} />
    </div>
  );
};

export default Charts;
