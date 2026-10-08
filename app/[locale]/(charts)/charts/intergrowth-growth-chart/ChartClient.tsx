"use client";

import { useSearchParams } from "next/navigation";
import GrowthChartExplorer from "@/components/GrowthChartExplorer";
import { referenceChartData } from "@/lib/growth-chart-config";
import { useSubscriptionStore } from "@/stores/premiumStore";
import { useIntergrowthChartData } from "@/hooks/calculations/use-intergrowth-chart-data";
import IntergrowthChartDisplay from "./IntergrowthChartDisplay";

export default function ChartClient() {
  const searchParams = useSearchParams();
  const { isFullCurveView } = useSubscriptionStore();
  const { data, isError, error, refetch } = useIntergrowthChartData(searchParams);
  const hasMeasurements = Boolean(searchParams.get("weightData") && searchParams.get("heightData"));

  return (
    <GrowthChartExplorer
      standard="intergrowth"
      isLoading={!data && !isError}
      error={isError ? error : null}
      isInvalid={Boolean(data && (!data.success || !data.data?.weight || !data.data?.height))}
      onRetry={() => { refetch(); }}
      renderChart={(metric, gender) => (
        <IntergrowthChartDisplay
          rawData={hasMeasurements && data ? data : referenceChartData(gender)}
          type={metric}
          isFullCurveView={!hasMeasurements || isFullCurveView}
          weekRangeAround={isFullCurveView ? 19 : 4}
        />
      )}
    />
  );
}
