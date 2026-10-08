"use client";

import { useSearchParams } from "next/navigation";
import GrowthChartExplorer from "@/components/GrowthChartExplorer";
import { referenceChartData } from "@/lib/growth-chart-config";
import { useSubscriptionStore } from "@/stores/premiumStore";
import { useGrowthChartData } from "@/hooks/calculations/use-growth-chart-data";
import GrowthChartDisplay from "./GrowthChartDisplay";

export default function ChartClient() {
  const searchParams = useSearchParams();
  const { isFullCurveView } = useSubscriptionStore();
  const { data, isError, error, refetch } = useGrowthChartData(searchParams);
  const hasMeasurements = Boolean(searchParams.get("weightData") && searchParams.get("heightData"));

  return (
    <GrowthChartExplorer
      standard="cdc_child"
      isLoading={!data && !isError}
      error={isError ? error : null}
      isInvalid={Boolean(data && (!data.success || !data.data?.weight || !data.data?.height))}
      onRetry={() => { refetch(); }}
      renderChart={(metric, gender) => (
        <GrowthChartDisplay
          rawData={hasMeasurements && data ? data : referenceChartData(gender)}
          type={metric}
          isFullCurveView={!hasMeasurements || isFullCurveView}
          yearRangeAround={isFullCurveView ? 18 : 4}
        />
      )}
    />
  );
}
