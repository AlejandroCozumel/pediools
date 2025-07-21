"use client";
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipModel,
  ChartOptions,
  Point,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import whoWeightData from "@/app/data/who-data-weight.json";
import whoHeightData from "@/app/data/who-data-height.json";
import { useTranslations } from 'next-intl';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

// Interfaces
interface WHODataPoint {
  Sex: number;
  Agemos: number;
  L: number;
  M: number;
  S: number;
  P3: number;
  P5: number;
  P10: number;
  P25: number;
  P50: number;
  P75: number;
  P90: number;
  P95: number;
  P97: number;
}

interface ProcessedDataPoint {
  ageInMonths: number;
  P3: number;
  P5: number;
  P10: number;
  P25: number;
  P50: number;
  P75: number;
  P90: number;
  P95: number;
  P97: number;
}

interface PatientDataPoint {
  x: number;
  y: number;
  percentile: number;
}

interface ChartProps {
  rawData: {
    success: boolean;
    originalInput: {
      weight: { gender: "male" | "female" };
      height: { gender: "male" | "female" };
    };
    data: {
      weight: Array<{
        ageInMonths: number;
        weight: {
          value: number;
          percentiles: { calculatedPercentile: number };
        };
      }>;
      height: Array<{
        ageInMonths: number;
        height: {
          value: number;
          percentiles: { calculatedPercentile: number };
        };
      }>;
    };
  };
  type: "weight" | "height";
  isFullCurveView: boolean;
  monthRangeAround: number;
}

interface CustomTooltipDataPoint {
  label: string;
  value: string;
  color: string;
  isPatient: boolean;
}

interface CustomHtmlTooltipProps {
  visible: boolean;
  position: { x: number; y: number };
  title: string;
  dataPoints: CustomTooltipDataPoint[];
}

const CustomHtmlTooltip: React.FC<CustomHtmlTooltipProps> = ({
  visible,
  position,
  title,
  dataPoints,
}) => {
  if (!visible || dataPoints.length === 0) return null;
  return (
    <div
      className="bg-white p-3 border border-gray-300 shadow-lg rounded-md text-sm pointer-events-none transition-opacity duration-100"
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: visible ? 1 : 0,
        transform: "translate(-50%, calc(-100% - 10px))",
        whiteSpace: "nowrap",
        zIndex: 50,
      }}
    >
      <p className="font-semibold text-gray-900 mb-1">{title}</p>
      <div className="space-y-0.5">
        {dataPoints.map((point) => (
          <p key={point.label} className="flex justify-between gap-3">
            <span
              style={{ color: point.color }}
              className={`${
                point.isPatient ? "font-bold text-red-600" : "font-medium"
              }`}
            >
              {point.label}:
            </span>
            <span
              className={`${point.isPatient ? "font-bold text-red-600" : ""}`}
            >
              {point.value}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
};

const WHOChartDisplay: React.FC<ChartProps> = ({
  rawData,
  type,
  isFullCurveView,
  monthRangeAround,
}) => {
  const t = useTranslations('WHOChartDisplay');

  const chartConfigs = {
    weight: {
      sourceData: whoWeightData,
      dataKey: "weight" as const,
      inputGenderKey: "weight" as const,
      title: t('weightForAgeChartTitle'),
      yAxisLabel: t('weightYAxisLabel'),
      yAxisUnit: t('kgUnit'),
      yAxisDomainFull: [0, 20] as [number, number],
      defaultRangeAround: 8,
      valueAccessor: (m: any) => m?.weight?.value,
      percentileAccessor: (m: any) => m?.weight?.percentiles?.calculatedPercentile,
    },
    height: {
      sourceData: whoHeightData,
      dataKey: "height" as const,
      inputGenderKey: "height" as const,
      title: t('heightForAgeChartTitle'),
      yAxisLabel: t('heightYAxisLabel'),
      yAxisUnit: t('cmUnit'),
      yAxisDomainFull: [40, 100] as [number, number],
      defaultRangeAround: 25,
      valueAccessor: (m: any) => m?.height?.value,
      percentileAccessor: (m: any) => m?.height?.percentiles?.calculatedPercentile,
    },
  };
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const chartRef = useRef<ChartJS<"line", (number | Point | null)[], number> | null>(null);
  const [tooltipState, setTooltipState] = useState<CustomHtmlTooltipProps>({
    visible: false,
    position: { x: 0, y: 0 },
    title: "",
    dataPoints: [],
  });

  const config = chartConfigs[type];
  const yRangeAround = config.defaultRangeAround;

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMediumScreen(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Convert months to display format
  const formatAge = useCallback((ageInMonths: number): string => {
    if (ageInMonths < 1) {
      return `${Math.round(ageInMonths * 30)} months`;
    } else if (ageInMonths < 12) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = Math.round(ageInMonths % 12);
      return months > 0 ? `${years}y ${months}m` : `${years} years`;
    }
  }, []);

  const findClosestDataPoint = useCallback(
    (
      ageInMonths: number,
      gender: "male" | "female",
      sourceData: WHODataPoint[]
    ): WHODataPoint | null => {
      const sex = gender === "male" ? 1 : 2;
      const filteredData = sourceData.filter(
        (point) => point.Sex === sex && point.Agemos >= 0 && point.Agemos <= 24
      );

      if (filteredData.length === 0) return null;

      const exactMatch = filteredData.find((p) => p.Agemos === ageInMonths);
      if (exactMatch) return exactMatch;

      const sortedPoints = filteredData.sort(
        (a, b) =>
          Math.abs(a.Agemos - ageInMonths) - Math.abs(b.Agemos - ageInMonths)
      );

      const point1 = sortedPoints[0];
      const point2 = sortedPoints[1];

      if (point1.Agemos === point2.Agemos || point1.Agemos === ageInMonths) {
        return point1;
      }

      const factor =
        (ageInMonths - point1.Agemos) / (point2.Agemos - point1.Agemos);

      if (!isFinite(factor) || factor < 0 || factor > 1) {
        return point1;
      }

      return {
        Sex: point1.Sex,
        Agemos: ageInMonths,
        L: point1.L + (point2.L - point1.L) * factor,
        M: point1.M + (point2.M - point1.M) * factor,
        S: point1.S + (point2.S - point1.S) * factor,
        P3: point1.P3 + (point2.P3 - point1.P3) * factor,
        P5: point1.P5 + (point2.P5 - point1.P5) * factor,
        P10: point1.P10 + (point2.P10 - point1.P10) * factor,
        P25: point1.P25 + (point2.P25 - point1.P25) * factor,
        P50: point1.P50 + (point2.P50 - point1.P50) * factor,
        P75: point1.P75 + (point2.P75 - point1.P75) * factor,
        P90: point1.P90 + (point2.P90 - point1.P90) * factor,
        P95: point1.P95 + (point2.P95 - point1.P95) * factor,
        P97: point1.P97 + (point2.P97 - point1.P97) * factor,
      };
    },
    []
  );

  const generateChartDataPoints = useCallback(
    (
      sourceData: WHODataPoint[],
      gender: "male" | "female"
    ): ProcessedDataPoint[] => {
      const sex = gender === "male" ? 1 : 2;
      const filteredData = sourceData.filter(
        (point) => point.Sex === sex && point.Agemos >= 0 && point.Agemos <= 24
      );

      // Use the actual monthly data points from WHO (0, 1, 2, 3... 24 months)
      const monthlyAges = Array.from({ length: 25 }, (_, i) => i); // 0 to 24 months

      return monthlyAges
        .map((ageInMonths) => {
          // Find exact match first (WHO data comes in exact monthly intervals)
          const exactMatch = filteredData.find((p) => p.Agemos === ageInMonths);

          if (exactMatch) {
            return {
              ageInMonths: ageInMonths,
              P3: Number(exactMatch.P3.toFixed(2)),
              P5: Number(exactMatch.P5.toFixed(2)),
              P10: Number(exactMatch.P10.toFixed(2)),
              P25: Number(exactMatch.P25.toFixed(2)),
              P50: Number(exactMatch.P50.toFixed(2)),
              P75: Number(exactMatch.P75.toFixed(2)),
              P90: Number(exactMatch.P90.toFixed(2)),
              P95: Number(exactMatch.P95.toFixed(2)),
              P97: Number(exactMatch.P97.toFixed(2)),
            };
          }

          // If no exact match, interpolate (shouldn't happen with proper WHO data)
          const dataPoint = findClosestDataPoint(ageInMonths, gender, sourceData);
          if (!dataPoint) return null;

          return {
            ageInMonths: ageInMonths,
            P3: Number(dataPoint.P3.toFixed(2)),
            P5: Number(dataPoint.P5.toFixed(2)),
            P10: Number(dataPoint.P10.toFixed(2)),
            P25: Number(dataPoint.P25.toFixed(2)),
            P50: Number(dataPoint.P50.toFixed(2)),
            P75: Number(dataPoint.P75.toFixed(2)),
            P90: Number(dataPoint.P90.toFixed(2)),
            P95: Number(dataPoint.P95.toFixed(2)),
            P97: Number(dataPoint.P97.toFixed(2)),
          };
        })
        .filter((point) => point !== null) as ProcessedDataPoint[];
    },
    [findClosestDataPoint]
  );

  const { chartJsData, patientDataPointsWithPercentile } = useMemo(() => {
    const gender = rawData.originalInput[config.inputGenderKey].gender;
    const sourceData = config.sourceData as WHODataPoint[];
    const patientMeasurements = rawData.data[config.dataKey];

    const processedDataPoints = generateChartDataPoints(sourceData, gender);

    const patientPoints: PatientDataPoint[] = patientMeasurements
      .filter(
        (m) =>
          config.valueAccessor(m) !== undefined &&
          config.valueAccessor(m) !== null
      )
      .map((m) => ({
        x: m.ageInMonths,
        y: config.valueAccessor(m)!,
        percentile: config.percentileAccessor(m),
      }))
      .sort((a, b) => a.x - b.x);

    const percentileKeys = ["P3", "P5", "P10", "P25", "P50", "P75", "P90", "P95", "P97"] as const;
    const percentileColors = {
      P3: "#93C5FD",
      P5: "#60A5FA",
      P10: "#3B82F6",
      P25: "#2563EB",
      P50: "#1D4ED8",
      P75: "#1E40AF",
      P90: "#1E3A8A",
      P95: "#172554",
      P97: "#172554",
    };

    const chartData = {
      datasets: [
        ...percentileKeys.map((key) => ({
          label: `${key.slice(1)}th Perc.`,
          data: processedDataPoints.map((p) => ({ x: p.ageInMonths, y: p[key] })),
          borderColor: percentileColors[key],
          backgroundColor: percentileColors[key],
          borderWidth: key === "P50" ? 2.5 : 1.5,
          pointRadius: 0,
          tension: 0.4,
          fill: false,
          spanGaps: true,
          hidden: ![
            "P3",
            "P5",
            "P10",
            "P25",
            "P50",
            "P75",
            "P90",
            "P95",
            "P97",
          ].includes(key),
        })),
        {
          label: `${t('patientLabel')} ${t('genderLabel')}`,
          data: patientPoints,
          borderColor: "#DC2626",
          backgroundColor: "#DC2626",
          borderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#DC2626",
          tension: 0.1,
          showLine: patientPoints.length > 1,
          order: 10,
        },
      ],
    };

    return {
      chartJsData: chartData,
      patientDataPointsWithPercentile: patientPoints,
    };
  }, [rawData, config, generateChartDataPoints, t]);

  const currentPatientMeasurement =
    rawData.data[config.dataKey]?.length > 0
      ? rawData.data[config.dataKey][rawData.data[config.dataKey].length - 1]
      : undefined;

  const patientAge = currentPatientMeasurement
    ? currentPatientMeasurement.ageInMonths
    : null;

  const patientValue = currentPatientMeasurement
    ? config.valueAccessor(currentPatientMeasurement)
    : null;

  const latestCalculatedPercentile = currentPatientMeasurement
    ? config.percentileAccessor(currentPatientMeasurement)
    : null;

  const { minMonths, maxMonths, minYValue, maxYValue } = useMemo(() => {
    if (!patientAge || patientValue === null)
      return {
        minMonths: 0,
        maxMonths: 24,
        minYValue: config.yAxisDomainFull[0],
        maxYValue: config.yAxisDomainFull[1],
      };

    if (isFullCurveView)
      return {
        minMonths: 0,
        maxMonths: 24,
        minYValue: config.yAxisDomainFull[0],
        maxYValue: config.yAxisDomainFull[1],
      };
    else {
      const calcMinMonths = Math.max(0, patientAge - monthRangeAround / 2);
      const calcMaxMonths = Math.min(24, patientAge + monthRangeAround / 2);
      const calcMinY = Math.max(
        config.yAxisDomainFull[0],
        patientValue - yRangeAround / 2
      );
      const calcMaxY = Math.min(
        config.yAxisDomainFull[1],
        patientValue + yRangeAround / 2
      );

      const finalMaxMonths =
        calcMaxMonths <= calcMinMonths + 1 ? calcMinMonths + 3 : calcMaxMonths;
      const finalMaxY =
        calcMaxY <= calcMinY + (type === "weight" ? 1 : 5)
          ? calcMinY + (type === "weight" ? 3 : 15)
          : calcMaxY;

      return {
        minMonths: calcMinMonths,
        maxMonths: finalMaxMonths,
        minYValue: calcMinY,
        maxYValue: finalMaxY,
      };
    }
  }, [
    isFullCurveView,
    patientAge,
    patientValue,
    monthRangeAround,
    yRangeAround,
    config.yAxisDomainFull,
    type,
  ]);

  // Tooltip External Function
  const externalTooltipHandler = useCallback(
    (context: { chart: ChartJS; tooltip: TooltipModel<"line"> }) => {
      const { chart, tooltip } = context;
      const chartCanvas = chart.canvas;

      if (tooltip.opacity === 0) {
        setTooltipState((prev) => ({ ...prev, visible: false }));
        return;
      }

      const tooltipItems = tooltip.dataPoints;
      if (!tooltipItems || tooltipItems.length === 0) {
        setTooltipState((prev) => ({ ...prev, visible: false }));
        return;
      }

      const position = {
        x: chartCanvas.offsetLeft + tooltip.caretX,
        y: chartCanvas.offsetTop + tooltip.caretY,
      };

      // Get the actual age from the tooltip data point instead of pixel calculation
      // This is more reliable, especially at age 0
      let actualAge = 0;
      if (tooltipItems[0] && tooltipItems[0].parsed && typeof tooltipItems[0].parsed.x === 'number') {
        actualAge = tooltipItems[0].parsed.x;
      } else {
        // Fallback to pixel calculation if parsed data not available
        const ageFromPixel = chart.scales.x.getValueForPixel(tooltip.caretX);
        if (ageFromPixel !== undefined && ageFromPixel !== null) {
          actualAge = ageFromPixel;
        }
      }

      // Ensure age is within valid range
      const clampedAge = Math.max(0, Math.min(24, actualAge));
      const roundedAge = Math.round(clampedAge);

      const title = `${t('ageLabel')}: ${formatAge(clampedAge)}`;

      const allValuesForAge: CustomTooltipDataPoint[] = [];
      const currentDatasets = chart.data.datasets;

      // Get percentile data for the actual hovered monthly age
      currentDatasets.forEach((dataset: any, i: number) => {
        if (!chart.isDatasetVisible(i) || dataset.label?.startsWith(t('patientLabel')))
          return;

        // Find the data point for this exact monthly age
        const dataPoint = dataset.data.find((point: any) =>
          point && typeof point === 'object' && Math.abs(point.x - roundedAge) < 0.1
        );

        if (dataPoint && typeof dataPoint.y === "number") {
          let label = dataset.label || "";
          let color = dataset.borderColor || "#000";
          const match = label.match(/(\d+(\.\d+)?)th Perc./);
          label = match ? `${t('percentileLabel')}${match[1]}` : label;
          allValuesForAge.push({
            label,
            value: `${dataPoint.y.toFixed(1)} ${config.yAxisUnit}`,
            color: color as string,
            isPatient: false,
          });
        }
      });

      // Check for patient data at this age
      const monthsTolerance = 0.5; // Half month tolerance
      const patientPointAtHover = patientDataPointsWithPercentile.find(
        (p) => Math.abs(p.x - clampedAge) < monthsTolerance
      );

      if (patientPointAtHover) {
        allValuesForAge.push({
          label: `${t('patientLabel')} (P${patientPointAtHover.percentile.toFixed(1)})`,
          value: `${patientPointAtHover.y.toFixed(1)} ${config.yAxisUnit}`,
          color: "#DC2626",
          isPatient: true,
        });
      }

      // Sort percentiles from highest to lowest
      allValuesForAge.sort((a, b) => {
        const getPercValue = (label: string): number => {
          let match = label.match(/Patient \(P(\d+(\.\d+)?)\)/);
          if (match?.[1]) return parseFloat(match[1]);
          match = label.match(/P(\d+(\.\d+)?)/);
          if (match?.[1]) return parseFloat(match[1]);
          return -Infinity;
        };
        return getPercValue(b.label) - getPercValue(a.label);
      });

      const newState = {
        visible: true,
        position: position,
        title: title,
        dataPoints: allValuesForAge,
      };
      setTooltipState(newState);
    },
    [patientDataPointsWithPercentile, config.yAxisUnit, formatAge, t]
  );

  // Chart.js Options
  const chartJsOptions: ChartOptions<"line"> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          min: minMonths,
          max: maxMonths,
          title: {
            display: true,
            text: `${t('ageLabel')} (${t('monthsLabel')})`,
            font: { size: 14 },
            color: "#374151",
          },
          ticks: {
            callback: function (value, index, ticks) {
              const numericValue = Number(value);

              if (isFullCurveView) {
                // In full view, show every 3 months for desktop, 6 for mobile
                const stepSize = isMediumScreen ? 3 : 6;
                if (numericValue % stepSize === 0 && numericValue >= 0 && numericValue <= 24) {
                  return numericValue;
                }
                return undefined;
              } else {
                // In focused view, show more frequent ticks
                const stepSize = isMediumScreen ? 1 : 2;
                if (numericValue % stepSize === 0 && numericValue >= Math.floor(minMonths) && numericValue <= Math.ceil(maxMonths)) {
                  return numericValue;
                }
                return undefined;
              }
            },
            autoSkip: true,
            maxRotation: 0,
            font: { size: 12 },
            color: "#6B7280",
          },
          grid: { color: "#E5E7EB80" },
        },
        y: {
          type: "linear",
          min: minYValue,
          max: maxYValue,
          title: {
            display: isMediumScreen,
            text: config.yAxisLabel,
            font: { size: 14 },
            color: "#374151",
          },
          ticks: {
            maxTicksLimit: isMediumScreen ? 10 : 6,
            font: { size: 12 },
            color: "#6B7280",
          },
          grid: { color: "#E5E7EB80" },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 12 }, boxWidth: 20, padding: 20 },
        },
        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
          mode: "index",
          intersect: false,
          callbacks: { title: () => "" },
        },
        annotation: {
          annotations: patientAge !== null
            ? {
                ageLine: {
                  type: "line",
                  xMin: patientAge,
                  xMax: patientAge,
                  borderColor: "#DC2626",
                  borderWidth: 1.5,
                  borderDash: [6, 6],
                  label: {
                    content: `${t('currentAgeLabel')}`,
                    display: true,
                    position: "end",
                    yAdjust: -10,
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    color: "#DC2626",
                    font: { weight: "bold", size: 11 },
                  },
                },
              }
            : {},
        },
      },
      interaction: { mode: "index", intersect: false, axis: "x" },
      elements: { line: { tension: 0.3 } },
    };
  }, [
    minMonths,
    maxMonths,
    minYValue,
    maxYValue,
    patientAge,
    isMediumScreen,
    isFullCurveView,
    config,
    externalTooltipHandler,
    t,
  ]);

  return (
    <div className="w-full relative">
      <Card className="bg-white shadow-lg group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
        <CardHeader className="relative space-y-4 pb-3 md:pb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-start bg-gradient-to-r from-medical-700 to-medical-900 bg-clip-text text-transparent text-base md:text-lg lg:text-xl font-bold tracking-tight">
                {rawData.originalInput[config.inputGenderKey].gender === "male"
                  ? t('boysLabel')
                  : t('girlsLabel')}
                {type === "weight" ? t('weightLabel') : t('heightLabel')}
                <span className="block text-sm md:text-base text-medical-90 font-medium">
                  {config.title}
                </span>
              </CardTitle>
              <div className="flex flex-wrap gap-2 md:gap-4">
                {patientValue !== null && (
                  <Badge variant="outline" className="text-xs md:text-sm">
                    {t('patientValueLabel')}: {patientValue}{" "}
                    {config.yAxisUnit}
                  </Badge>
                )}
                {patientAge !== null && (
                  <Badge variant="outline" className="text-xs md:text-sm">
                    {t('patientAgeLabel')}: {formatAge(patientAge)}
                  </Badge>
                )}
                {latestCalculatedPercentile !== undefined &&
                  latestCalculatedPercentile !== null && (
                    <Badge variant="outline" className="text-xs md:text-sm">
                      {t('percentileLabel')}${latestCalculatedPercentile.toFixed(1)}
                    </Badge>
                  )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full h-[450px] md:h-[600px] p-2 md:p-4">
            <Line ref={chartRef} options={chartJsOptions} data={chartJsData} />
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-100 mt-2 pt-3 pb-3">
          <p className="text-xs text-gray-500">
            {t('dataSourceLabel')}
          </p>
        </CardFooter>
      </Card>
      <CustomHtmlTooltip
        visible={tooltipState.visible}
        position={tooltipState.position}
        title={tooltipState.title}
        dataPoints={tooltipState.dataPoints}
      />
    </div>
  );
};

export default WHOChartDisplay;