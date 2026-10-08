"use client";

import { useSearchParams } from "next/navigation";
import GrowthChartExplorer from "@/components/GrowthChartExplorer";
import { referenceChartData } from "@/lib/growth-chart-config";
import { useSubscriptionStore } from "@/stores/premiumStore";
import { useInfantGrowthChartData } from "@/hooks/calculations/use-infant-growth-chart-data";
import CDCChartInfantDisplay from "./CDCChartInfantDisplay";

export default function ChartClient() {
  const searchParams = useSearchParams();
  const { isFullCurveView } = useSubscriptionStore();
  const { data, isError, error, refetch } = useInfantGrowthChartData(searchParams);
  const hasMeasurements = Boolean(searchParams.get("weightData") && searchParams.get("heightData"));

  return (
    <GrowthChartExplorer
      standard="cdc_infant"
      isLoading={!data && !isError}
      error={isError ? error : null}
      isInvalid={Boolean(data && (!data.success || !data.data?.weight || !data.data?.height))}
      onRetry={() => { refetch(); }}
      renderChart={(metric, gender) => (
        <CDCChartInfantDisplay
          rawData={hasMeasurements && data ? data : referenceChartData(gender)}
          type={metric}
          isFullCurveView={!hasMeasurements || isFullCurveView}
          monthRangeAround={isFullCurveView ? 36 : 4}
        />
      )}
    />
  );
}
