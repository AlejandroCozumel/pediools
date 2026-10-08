"use client";

import { useSearchParams } from "next/navigation";
import GrowthChartExplorer from "@/components/GrowthChartExplorer";
import { referenceChartData } from "@/lib/growth-chart-config";
import { useSubscriptionStore } from "@/stores/premiumStore";
import { useWHOChartData } from "@/hooks/calculations/use-who-chart-data";
import WHOChartDisplay from "./WHOChartDisplay";

export default function ChartClient() {
  const searchParams = useSearchParams();
  const { isFullCurveView } = useSubscriptionStore();
  const { data, isError, error, refetch } = useWHOChartData(searchParams);
  const hasMeasurements = Boolean(searchParams.get("weightData") && searchParams.get("heightData"));

  return (
    <GrowthChartExplorer
      standard="who"
      isLoading={!data && !isError}
      error={isError ? error : null}
      isInvalid={Boolean(data && (!data.success || !data.data?.weight || !data.data?.height))}
      onRetry={() => { refetch(); }}
      renderChart={(metric, gender) => (
        <WHOChartDisplay
          rawData={hasMeasurements && data ? data : referenceChartData(gender)}
          type={metric}
          isFullCurveView={!hasMeasurements || isFullCurveView}
          monthRangeAround={isFullCurveView ? 24 : 6}
        />
      )}
    />
  );
}
