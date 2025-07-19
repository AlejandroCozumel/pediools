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
import intergrowthWeightData from "@/app/data/intergrowht-weight.json";
import intergrowthHeightData from "@/app/data/intergrowht-lenght.json";

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
interface IntergrowthDataPoint {
  sex: number;
  age: string;
  "3rd": number;
  "5th": number;
  "10th": number;
  "50th": number;
  "90th": number;
  "95th": number;
  "97th": number;
}

interface ProcessedDataPoint {
  gestationalWeeks: number;
  P3: number;
  P5: number;
  P10: number;
  P50: number;
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
        gestationalAge: number;
        gestationalDays: number;
        weight: {
          value: number;
          percentiles: { calculatedPercentile: number };
        };
      }>;
      height: Array<{
        gestationalAge: number;
        gestationalDays: number;
        height: {
          value: number;
          percentiles: { calculatedPercentile: number };
        };
      }>;
    };
  };
  type: "weight" | "height";
  isFullCurveView: boolean;
  weekRangeAround: number;
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

const chartConfigs = {
  weight: {
    sourceData: intergrowthWeightData,
    dataKey: "weight" as const,
    inputGenderKey: "weight" as const,
    title: "Weight For Gestational Age Chart",
    yAxisLabel: "Weight (kg)",
    yAxisUnit: "kg",
    yAxisDomainFull: [0, 5] as [number, number],
    defaultRangeAround: 2,
    valueAccessor: (m: any) => m?.weight?.value,
    percentileAccessor: (m: any) => m?.weight?.percentiles?.calculatedPercentile,
  },
  height: {
    sourceData: intergrowthHeightData,
    dataKey: "height" as const,
    inputGenderKey: "height" as const,
    title: "Length For Gestational Age Chart",
    yAxisLabel: "Length (cm)",
    yAxisUnit: "cm",
    yAxisDomainFull: [20, 60] as [number, number],
    defaultRangeAround: 15,
    valueAccessor: (m: any) => m?.height?.value,
    percentileAccessor: (m: any) => m?.height?.percentiles?.calculatedPercentile,
  },
};

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

const IntergrowthChartDisplay: React.FC<ChartProps> = ({
  rawData,
  type,
  isFullCurveView,
  weekRangeAround,
}) => {
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

  // Convert gestational age to decimal weeks
  const convertToDecimalWeeks = useCallback((weeks: number, days: number): number => {
    return weeks + days / 7;
  }, []);

  // Convert decimal weeks back to weeks+days format for display
  const formatGestationalAge = useCallback((decimalWeeks: number): string => {
    const weeks = Math.floor(decimalWeeks);
    const days = Math.round((decimalWeeks - weeks) * 7);
    return `${weeks}+${days}`;
  }, []);

  const findClosestDataPoint = useCallback(
    (
      gestationalAge: number,
      gestationalDays: number,
      gender: "male" | "female",
      sourceData: IntergrowthDataPoint[]
    ): IntergrowthDataPoint | null => {
      const sex = gender === "male" ? 1 : 2;
      const totalDays = gestationalAge * 7 + gestationalDays;
      const ageString = `${gestationalAge}+${gestationalDays}`;

      // First try exact match
      const exactMatch = sourceData.find(
        (point) => point.sex === sex && point.age === ageString
      );
      if (exactMatch) return exactMatch;

      // If no exact match, find closest point
      const filteredData = sourceData.filter((point) => point.sex === sex);
      if (filteredData.length === 0) return null;

      return filteredData.reduce((prev, curr) => {
        const [prevWeeks, prevDays] = prev.age.split("+").map(Number);
        const [currWeeks, currDays] = curr.age.split("+").map(Number);

        const prevTotalDays = prevWeeks * 7 + prevDays;
        const currTotalDays = currWeeks * 7 + currDays;

        const prevDiff = Math.abs(prevTotalDays - totalDays);
        const currDiff = Math.abs(currTotalDays - totalDays);

        return prevDiff < currDiff ? prev : curr;
      });
    },
    []
  );

  const generateChartDataPoints = useCallback(
    (
      sourceData: IntergrowthDataPoint[],
      gender: "male" | "female"
    ): ProcessedDataPoint[] => {
      const sex = gender === "male" ? 1 : 2;
      const filteredData = sourceData.filter((point) => point.sex === sex);

      return filteredData.map((point) => {
        const [weeks, days] = point.age.split("+").map(Number);
        const decimalWeeks = convertToDecimalWeeks(weeks, days);

        return {
          gestationalWeeks: decimalWeeks,
          P3: point["3rd"],
          P5: point["5th"],
          P10: point["10th"],
          P50: point["50th"],
          P90: point["90th"],
          P95: point["95th"],
          P97: point["97th"],
        };
      }).sort((a, b) => a.gestationalWeeks - b.gestationalWeeks);
    },
    [convertToDecimalWeeks]
  );

  // Updated section for smooth lines - replace the chartData generation in your useMemo

const { chartJsData, patientDataPointsWithPercentile } = useMemo(() => {
  const gender = rawData.originalInput[config.inputGenderKey].gender;
  const sourceData = config.sourceData as IntergrowthDataPoint[];
  const patientMeasurements = rawData.data[config.dataKey];

  const processedDataPoints = generateChartDataPoints(sourceData, gender);

  const patientPoints: PatientDataPoint[] = patientMeasurements
    .filter(
      (m) =>
        config.valueAccessor(m) !== undefined &&
        config.valueAccessor(m) !== null
    )
    .map((m) => ({
      x: convertToDecimalWeeks(m.gestationalAge, m.gestationalDays),
      y: config.valueAccessor(m)!,
      percentile: config.percentileAccessor(m),
    }))
    .sort((a, b) => a.x - b.x);

  // Filter out percentiles that don't exist in Intergrowth data
  const availablePercentileKeys = ["P3", "P5", "P10", "P50", "P90", "P95", "P97"] as const;

  // Check which percentiles actually have data
  const validPercentiles = availablePercentileKeys.filter(key => {
    return processedDataPoints.some(point =>
      point[key] !== undefined &&
      point[key] !== null &&
      !isNaN(point[key])
    );
  });

  const percentileColors = {
    P3: "#93C5FD",
    P5: "#60A5FA",
    P10: "#3B82F6",
    P50: "#1D4ED8",
    P90: "#1E3A8A",
    P95: "#172554",
    P97: "#172554",
  };

  const chartData = {
    datasets: [
      ...validPercentiles.map((key) => ({
        label: `${key.slice(1)}th Perc.`,
        data: processedDataPoints
          .filter(p => p[key] !== undefined && p[key] !== null && !isNaN(p[key]))
          .map((p) => ({ x: p.gestationalWeeks, y: p[key] })),
        borderColor: percentileColors[key],
        backgroundColor: percentileColors[key],
        borderWidth: key === "P50" ? 2.5 : 1.5,
        pointRadius: 0,
        tension: 0.4, // Increased for smoother curves
        fill: false,
        spanGaps: true, // This helps connect gaps in data
        hidden: false,
      })),
      {
        label: `Patient ${config.title.split(" ")[0]}`,
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
}, [rawData, config, generateChartDataPoints, convertToDecimalWeeks]);

  const currentPatientMeasurement =
    rawData.data[config.dataKey]?.length > 0
      ? rawData.data[config.dataKey][rawData.data[config.dataKey].length - 1]
      : undefined;

  const patientGestationalAge = currentPatientMeasurement
    ? convertToDecimalWeeks(
        currentPatientMeasurement.gestationalAge,
        currentPatientMeasurement.gestationalDays
      )
    : null;

  const patientValue = currentPatientMeasurement
    ? config.valueAccessor(currentPatientMeasurement)
    : null;

  const latestCalculatedPercentile = currentPatientMeasurement
    ? config.percentileAccessor(currentPatientMeasurement)
    : null;

  const { minWeeks, maxWeeks, minYValue, maxYValue } = useMemo(() => {
    if (!patientGestationalAge || patientValue === null)
      return {
        minWeeks: 24,
        maxWeeks: 42,
        minYValue: config.yAxisDomainFull[0],
        maxYValue: config.yAxisDomainFull[1],
      };

    if (isFullCurveView)
      return {
        minWeeks: 24,
        maxWeeks: 42,
        minYValue: config.yAxisDomainFull[0],
        maxYValue: config.yAxisDomainFull[1],
      };
    else {
      const calcMinWeeks = Math.max(24, patientGestationalAge - weekRangeAround / 2);
      const calcMaxWeeks = Math.min(42, patientGestationalAge + weekRangeAround / 2);
      const calcMinY = Math.max(
        config.yAxisDomainFull[0],
        patientValue - yRangeAround / 2
      );
      const calcMaxY = Math.min(
        config.yAxisDomainFull[1],
        patientValue + yRangeAround / 2
      );

      const finalMaxWeeks =
        calcMaxWeeks <= calcMinWeeks + 0.5 ? calcMinWeeks + 2 : calcMaxWeeks;
      const finalMaxY =
        calcMaxY <= calcMinY + (type === "weight" ? 0.2 : 2)
          ? calcMinY + (type === "weight" ? 0.5 : 5)
          : calcMaxY;

      return {
        minWeeks: calcMinWeeks,
        maxWeeks: finalMaxWeeks,
        minYValue: calcMinY,
        maxYValue: finalMaxY,
      };
    }
  }, [
    isFullCurveView,
    patientGestationalAge,
    patientValue,
    weekRangeAround,
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

      // Get the actual gestational age from the tooltip data point instead of pixel calculation
      let actualGestationalWeeks = 24; // Default to 24 weeks
      if (tooltipItems[0] && tooltipItems[0].parsed && typeof tooltipItems[0].parsed.x === 'number') {
        actualGestationalWeeks = tooltipItems[0].parsed.x;
      } else {
        // Fallback to pixel calculation if parsed data not available
        const weeksFromPixel = chart.scales.x.getValueForPixel(tooltip.caretX);
        if (weeksFromPixel !== undefined && weeksFromPixel !== null) {
          actualGestationalWeeks = weeksFromPixel;
        }
      }

      // Ensure gestational age is within valid range
      const clampedWeeks = Math.max(24, Math.min(42, actualGestationalWeeks));
      const title = `Gestational Age: ${formatGestationalAge(clampedWeeks)}`;

      // Find the exact gestational age string (weeks+days format)
      const weeks = Math.floor(clampedWeeks);
      const days = Math.round((clampedWeeks - weeks) * 7);
      const targetAgeString = `${weeks}+${days}`;

      const allValuesForAge: CustomTooltipDataPoint[] = [];
      const currentDatasets = chart.data.datasets;

      // Get percentile data for the actual hovered gestational age
      currentDatasets.forEach((dataset: any, i: number) => {
        if (!chart.isDatasetVisible(i) || dataset.label?.startsWith("Patient"))
          return;

        // Find the data point for this exact gestational age (with small tolerance for decimal precision)
        const dataPoint = dataset.data.find((point: any) =>
          point && typeof point === 'object' && Math.abs(point.x - clampedWeeks) < 0.05
        );

        if (dataPoint && typeof dataPoint.y === "number") {
          let label = dataset.label || "";
          let color = dataset.borderColor || "#000";
          const match = label.match(/(\d+(\.\d+)?)th Perc./);
          label = match ? `P${match[1]}` : label;
          allValuesForAge.push({
            label,
            value: `${dataPoint.y.toFixed(1)} ${config.yAxisUnit}`,
            color: color as string,
            isPatient: false,
          });
        }
      });

      // Check for patient data at this gestational age
      const weeksTolerance = 0.1; // About 0.7 days tolerance
      const patientPointAtHover = patientDataPointsWithPercentile.find(
        (p) => Math.abs(p.x - clampedWeeks) < weeksTolerance
      );

      if (patientPointAtHover) {
        allValuesForAge.push({
          label: `Patient (P${patientPointAtHover.percentile.toFixed(1)})`,
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
    [patientDataPointsWithPercentile, config.yAxisUnit, formatGestationalAge]
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
          min: minWeeks,
          max: maxWeeks,
          title: {
            display: true,
            text: "Gestational Age (weeks)",
            font: { size: 14 },
            color: "#374151",
          },
          ticks: {
            callback: function (value, index, ticks) {
              const numericValue = Number(value);
              const weeks = Math.floor(numericValue);

              if (isFullCurveView) {
                // In full view, show every 2 weeks
                if (weeks % 2 === 0 && weeks >= 24 && weeks <= 42) {
                  return weeks;
                }
                return undefined;
              } else {
                // In focused view, show more frequent ticks
                if (weeks >= Math.floor(minWeeks) && weeks <= Math.ceil(maxWeeks)) {
                  const prevTickFloor = index > 0 ? Math.floor(Number(ticks[index - 1].value)) : null;
                  if (weeks !== prevTickFloor) {
                    return weeks;
                  }
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
            maxTicksLimit: isMediumScreen ? 9 : 6,
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
          annotations: patientGestationalAge
            ? {
                ageLine: {
                  type: "line",
                  xMin: patientGestationalAge,
                  xMax: patientGestationalAge,
                  borderColor: "#DC2626",
                  borderWidth: 1.5,
                  borderDash: [6, 6],
                  label: {
                    content: "Current GA",
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
    minWeeks,
    maxWeeks,
    minYValue,
    maxYValue,
    patientGestationalAge,
    isMediumScreen,
    isFullCurveView,
    config,
    externalTooltipHandler,
  ]);

  return (
    <div className="w-full relative">
      <Card className="bg-white shadow-lg group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
        <CardHeader className="relative space-y-4 pb-3 md:pb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-start bg-gradient-to-r from-medical-700 to-medical-900 bg-clip-text text-transparent text-base md:text-lg lg:text-xl font-bold tracking-tight">
                {rawData.originalInput[config.inputGenderKey].gender === "male"
                  ? "Boys"
                  : "Girls"}
                {type === "weight" ? " (Weight)" : " (Length)"}
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
                {patientGestationalAge !== null && (
                  <Badge variant="outline" className="text-xs md:text-sm">
                    GA: {formatGestationalAge(patientGestationalAge)}
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
            Data source: Intergrowth-21st Growth Standards (24-42 weeks)
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

export default IntergrowthChartDisplay;