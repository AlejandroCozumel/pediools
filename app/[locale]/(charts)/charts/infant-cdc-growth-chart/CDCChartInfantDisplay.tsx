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
import cdcInfantWeightData from "@/app/data/cdc-data-infant-weight.json";
import cdcInfantHeightData from "@/app/data/cdc-data-infant-height.json";
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
interface CDCDataPoint {
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
  age: number;
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
    progressionData?: Array<{
      date: string;
      age: string;
      weight: string;
      height: string;
      bmi: string;
    }>;
  };
  type: "weight" | "height";
  isFullCurveView: boolean;
  monthRangeAround?: number;
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

const CDCChartInfantDisplay: React.FC<ChartProps> = ({
  rawData,
  type,
  isFullCurveView,
  monthRangeAround = 12,
}) => {
  const t = useTranslations('InfantCDCChartDisplay');

  const chartConfigs = {
    weight: {
      cdcSourceData: cdcInfantWeightData,
      dataKey: "weight" as const,
      inputGenderKey: "weight" as const,
      title: t('weightForAgeChartTitle'),
      yAxisLabel: t('weightYAxisLabel'),
      yAxisUnit: t('kgUnit'),
      yAxisDomainFull: [0, 25] as [number, number],
      defaultRangeAround: 8,
      valueAccessor: (m: any) => m?.weight?.value,
      percentileAccessor: (m: any) =>
        m?.weight?.percentiles?.calculatedPercentile,
    },
    height: {
      cdcSourceData: cdcInfantHeightData,
      dataKey: "height" as const,
      inputGenderKey: "height" as const,
      title: t('heightForAgeChartTitle'),
      yAxisLabel: t('heightYAxisLabel'),
      yAxisUnit: t('cmUnit'),
      yAxisDomainFull: [40, 110] as [number, number],
      defaultRangeAround: 20,
      valueAccessor: (m: any) => m?.height?.value,
      percentileAccessor: (m: any) =>
        m?.height?.percentiles?.calculatedPercentile,
    },
  };
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const chartRef = useRef<ChartJS<
    "line",
    (number | Point | null)[],
    number
  > | null>(null);
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

  const findClosestDataPoint = useCallback(
    (
      ageInMonths: number,
      gender: "male" | "female",
      sourceCdcData: CDCDataPoint[]
    ): CDCDataPoint | null => {
      const sex = gender === "male" ? 1 : 2;
      const filteredData = sourceCdcData.filter(
        (p) => p.Sex === sex && p.Agemos >= 0 && p.Agemos <= 36
      );

      if (filteredData.length === 0) return null;

      const exactMatch = filteredData.find((p) => p.Agemos === ageInMonths);
      if (exactMatch) return exactMatch;

      const clampedAgeInMonths = Math.max(0, Math.min(ageInMonths, 36));

      let lowerPoint: CDCDataPoint | undefined,
        upperPoint: CDCDataPoint | undefined;

      const sortedFilteredData = filteredData.sort(
        (a, b) => a.Agemos - b.Agemos
      );

      for (const point of sortedFilteredData) {
        if (point.Agemos <= clampedAgeInMonths) lowerPoint = point;
        if (point.Agemos >= clampedAgeInMonths) {
          upperPoint = point;
          break;
        }
      }

      if (!lowerPoint && !upperPoint) return null;
      if (!lowerPoint) return upperPoint!;
      if (!upperPoint) return lowerPoint!;
      if (lowerPoint.Agemos === upperPoint.Agemos) return lowerPoint;

      const range = upperPoint.Agemos - lowerPoint.Agemos;
      if (range === 0) return lowerPoint;

      const factor = (clampedAgeInMonths - lowerPoint.Agemos) / range;

      if (!isFinite(factor) || factor < 0 || factor > 1) {
        return Math.abs(clampedAgeInMonths - lowerPoint.Agemos) <
          Math.abs(clampedAgeInMonths - upperPoint.Agemos)
          ? lowerPoint
          : upperPoint;
      }

      return {
        Sex: lowerPoint.Sex,
        Agemos: clampedAgeInMonths,
        L: lowerPoint.L + (upperPoint.L - lowerPoint.L) * factor,
        M: lowerPoint.M + (upperPoint.M - lowerPoint.M) * factor,
        S: lowerPoint.S + (upperPoint.S - lowerPoint.S) * factor,
        P3: lowerPoint.P3 + (upperPoint.P3 - lowerPoint.P3) * factor,
        P5: lowerPoint.P5 + (upperPoint.P5 - lowerPoint.P5) * factor,
        P10: lowerPoint.P10 + (upperPoint.P10 - lowerPoint.P10) * factor,
        P25: lowerPoint.P25 + (upperPoint.P25 - lowerPoint.P25) * factor,
        P50: lowerPoint.P50 + (upperPoint.P50 - lowerPoint.P50) * factor,
        P75: lowerPoint.P75 + (upperPoint.P75 - lowerPoint.P75) * factor,
        P90: lowerPoint.P90 + (upperPoint.P90 - lowerPoint.P90) * factor,
        P95: lowerPoint.P95 + (upperPoint.P95 - lowerPoint.P95) * factor,
        P97: lowerPoint.P97 + (upperPoint.P97 - lowerPoint.P97) * factor,
      };
    },
    []
  );

  const generateChartDataPoints = useCallback(
    (
      sourceCdcData: CDCDataPoint[],
      gender: "male" | "female"
    ): ProcessedDataPoint[] => {
      const step = 0.5; // Every 2 weeks
      const agesInMonths = [];
      for (let age = 0; age <= 36; age += step) agesInMonths.push(age);

      let allDataPoints = agesInMonths
        .map((ageInMonths) => {
          const dataPoint = findClosestDataPoint(
            ageInMonths,
            gender,
            sourceCdcData
          );
          if (!dataPoint) return null;

          return {
            age: Number(ageInMonths.toFixed(2)),
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

      return allDataPoints;
    },
    [findClosestDataPoint]
  );

  const { chartJsData, patientDataPointsWithPercentile } = useMemo(() => {
    const gender = rawData.originalInput[config.inputGenderKey].gender;
    const sourceData = config.cdcSourceData;
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

    const percentileKeys = [
      "P3",
      "P5",
      "P10",
      "P25",
      "P50",
      "P75",
      "P90",
      "P95",
      "P97",
    ] as const;

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
          data: processedDataPoints.map((p) => ({ x: p.age, y: p[key] })),
          borderColor: percentileColors[key],
          backgroundColor: percentileColors[key],
          borderWidth: key === "P50" ? 2.5 : 1.5,
          pointRadius: 0,
          tension: 0.4,
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
          label: `${t('patientChartLabel', { gender: gender === 'male' ? t('boys') : t('girls') })} ${type === 'weight' ? t('weightLabel') : t('heightLabel')}`,
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
  }, [rawData, config, generateChartDataPoints, type, t]);

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
  const { minAge, maxAge, minYValue, maxYValue } = useMemo(() => {
    if (!patientAge || patientValue === null)
      return {
        minAge: 0,
        maxAge: 36,
        minYValue: config.yAxisDomainFull[0],
        maxYValue: config.yAxisDomainFull[1],
      };

    if (isFullCurveView)
      return {
        minAge: 0,
        maxAge: 36,
        minYValue: config.yAxisDomainFull[0],
        maxYValue: config.yAxisDomainFull[1],
      };
    else {
      const calcMinAge = Math.max(0, patientAge - monthRangeAround / 2);
      const calcMaxAge = Math.min(36, patientAge + monthRangeAround / 2);
      const calcMinY = Math.max(
        config.yAxisDomainFull[0],
        patientValue - yRangeAround / 2
      );
      const calcMaxY = Math.min(
        config.yAxisDomainFull[1],
        patientValue + yRangeAround / 2
      );

      const finalMaxAge =
        calcMaxAge <= calcMinAge + 2 ? calcMinAge + 4 : calcMaxAge;
      const finalMaxY =
        calcMaxY <= calcMinY + (type === "weight" ? 1 : 2)
          ? calcMinY + (type === "weight" ? 3 : 6)
          : calcMaxY;

      return {
        minAge: calcMinAge,
        maxAge: finalMaxAge,
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
      let actualAge = 0; // Default to 0 months
      if (
        tooltipItems[0] &&
        tooltipItems[0].parsed &&
        typeof tooltipItems[0].parsed.x === "number"
      ) {
        actualAge = tooltipItems[0].parsed.x;
      } else {
        // Fallback to pixel calculation if parsed data not available
        const ageFromPixel = chart.scales.x.getValueForPixel(tooltip.caretX);
        if (ageFromPixel !== undefined && ageFromPixel !== null) {
          actualAge = ageFromPixel;
        }
      }

      // Ensure age is within valid range
      const clampedAge = Math.max(0, Math.min(36, actualAge));
      const title = `${t('ageTooltip', { age: clampedAge.toFixed(1) })}`;

      // Find the correct data index using the step size (0.5 months)
      const step = 0.5; // Your data step (every 0.5 months)
      const baseAge = 0; // Starting age
      const calculatedIndex = Math.round((clampedAge - baseAge) / step);

      // Validate the calculated index against actual data
      const firstPercentileDataset = chart.data.datasets.find(
        (dataset) =>
          !dataset.label?.startsWith("Patient") &&
          dataset.data &&
          dataset.data.length > 0
      );

      let dataIndex = -1;
      if (
        firstPercentileDataset?.data &&
        calculatedIndex >= 0 &&
        calculatedIndex < firstPercentileDataset.data.length
      ) {
        // Verify the calculated index has the expected age value
        const dataPoint = firstPercentileDataset.data[calculatedIndex] as {
          x: number;
          y: number;
        } | null;
        if (dataPoint && typeof dataPoint.x === "number") {
          const ageDiff = Math.abs(dataPoint.x - clampedAge);
          // Accept if the age difference is within reasonable tolerance
          if (ageDiff <= step / 2) {
            dataIndex = calculatedIndex;
          }
        }
      }

      // Fallback: find closest point if calculated index doesn't work
      if (dataIndex === -1 && firstPercentileDataset?.data) {
        const dataPoints = firstPercentileDataset.data as {
          x: number;
          y: number;
        }[];
        let bestMatch = -1;
        let minDiff = Infinity;
        dataPoints.forEach((point, index) => {
          if (point && typeof point.x === "number") {
            const diff = Math.abs(point.x - clampedAge);
            if (diff < minDiff) {
              minDiff = diff;
              bestMatch = index;
            }
          }
        });
        dataIndex = bestMatch;
      }

      if (dataIndex === -1) {
        setTooltipState((prev) => ({ ...prev, visible: false }));
        return;
      }

      // Build tooltip data points
      const allValuesForAge: CustomTooltipDataPoint[] = [];
      const currentDatasets = chart.data.datasets;

      currentDatasets.forEach((dataset: any, i: number) => {
        if (!chart.isDatasetVisible(i) || dataset.label?.startsWith("Patient"))
          return;

        const pointData = dataset.data[dataIndex] as {
          x: number;
          y: number | null;
        } | null;
        const value =
          pointData &&
          typeof pointData === "object" &&
          pointData !== null &&
          typeof pointData.y === "number"
            ? pointData.y
            : null;

        if (value !== null) {
          let label = dataset.label || "";
          let color = dataset.borderColor || "#000";
          const match = label.match(/(\d+(\.\d+)?)th Perc./);
          label = match ? `P${match[1]}` : label;
          allValuesForAge.push({
            label,
            value: `${value.toFixed(1)} ${config.yAxisUnit}`,
            color: color as string,
            isPatient: false,
          });
        }
      });

      // Check for patient data at this age
      const ageTolerance = 0.5;
      const patientPointAtHover = patientDataPointsWithPercentile.find(
        (p) => Math.abs(p.x - clampedAge) < ageTolerance
      );

      if (patientPointAtHover) {
        allValuesForAge.push({
          label: `${t('patientTooltip', { percentile: patientPointAtHover.percentile.toFixed(1) })}`,
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
    [patientDataPointsWithPercentile, config.yAxisUnit, t]
  );

  useEffect(() => {
    if (chartRef.current && patientAge !== null) {
      const timerId = setTimeout(() => {
        const chart = chartRef.current;
        if (!chart) return;

        chart.update('none');
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [patientAge, isFullCurveView]);

  // Chart.js Options
  const chartJsOptions: ChartOptions<"line"> = useMemo(() => {
    const fullCurveYTicks = isMediumScreen
      ? Array.from(
          {
            length:
              Math.floor(
                (config.yAxisDomainFull[1] - config.yAxisDomainFull[0]) / 2
              ) + 1,
          },
          (_, i) => config.yAxisDomainFull[0] + i * 2
        )
      : Array.from(
          {
            length:
              Math.floor(
                (config.yAxisDomainFull[1] - config.yAxisDomainFull[0]) / 5
              ) + 1,
          },
          (_, i) => config.yAxisDomainFull[0] + i * 5
        );

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          min: minAge,
          max: maxAge,
          title: {
            display: true,
            text: t('ageAxisLabel'),
            font: { size: 14 },
            color: "#374151",
          },
          ticks: {
            callback: function (value, index, ticks) {
              const numericValue = Number(value);
              const floorValue = Math.floor(numericValue);

              if (isFullCurveView) {
                const targetTicks = isMediumScreen
                  ? Array.from({ length: 19 }, (_, i) => i * 2)
                  : [0, 6, 12, 18, 24, 30, 36];

                const prevTickFloor =
                  index > 0 ? Math.floor(Number(ticks[index - 1].value)) : null;

                if (
                  targetTicks.includes(floorValue) &&
                  floorValue !== prevTickFloor
                ) {
                  return floorValue;
                } else {
                  return undefined;
                }
              } else {
                const prevTickFloor =
                  index > 0 ? Math.floor(Number(ticks[index - 1].value)) : null;

                if (floorValue !== prevTickFloor) {
                  return floorValue;
                } else {
                  return undefined;
                }
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
            ...(isFullCurveView
              ? {
                  callback: (value: any) =>
                    fullCurveYTicks.includes(Number(value)) ? value : undefined,
                  stepSize: isMediumScreen ? 2 : 5,
                  autoSkip: false,
                }
              : { maxTicksLimit: isMediumScreen ? 9 : 6 }),
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
          annotations: patientAge
            ? {
                ageLine: {
                  type: "line",
                  xMin: patientAge,
                  xMax: patientAge,
                  borderColor: "#DC2626",
                  borderWidth: 1.5,
                  borderDash: [6, 6],
                  label: {
                    content: t('currentAgeAnnotation'),
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
    minAge,
    maxAge,
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
    <div className="w-full h-full relative">
      <Card className="bg-white shadow-lg group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
        <CardHeader className="relative space-y-4 pb-3 md:pb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-start bg-gradient-to-r from-medical-700 to-medical-900 bg-clip-text text-transparent text-base md:text-lg lg:text-xl font-bold tracking-tight">
                {rawData.originalInput[config.inputGenderKey].gender === "male"
                  ? t('boys')
                  : t('girls')}
                {type === "weight" ? t('weightLabel') : t('heightLabel')}
                <span className="block text-sm md:text-base text-medical-90 font-medium">
                  {config.title}
                </span>
              </CardTitle>
              <div className="flex flex-wrap gap-2 md:gap-4">
                {patientValue !== null && (
                  <Badge variant="outline" className="text-xs md:text-sm">
                    {config.title.split(" ")[0]}: {patientValue}{" "}
                    {config.yAxisUnit}
                  </Badge>
                )}
                {latestCalculatedPercentile !== undefined &&
                  latestCalculatedPercentile !== null && (
                    <Badge variant="outline" className="text-xs md:text-sm">
                      {latestCalculatedPercentile.toFixed(1)}th percentile
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
            {t('dataSource')}
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

export default CDCChartInfantDisplay;
