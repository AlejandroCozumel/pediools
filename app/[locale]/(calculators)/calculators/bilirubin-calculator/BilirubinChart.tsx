// Updated BilirubinChart component with isolated state management
"use client";
import React, { useMemo, useRef, useCallback, useState } from "react";
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
  ChartDataset,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

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

interface BilirubinResult {
  ageInHours: number;
  riskCategory: string;
  totalBilirubin: number;
  gestationalAge: number;
  hasRiskFactors: boolean;
  phototherapyThreshold: number;
  exchangeTransfusionThreshold: number;
  escalationOfCareThreshold: number;
  confirmWithTSBThreshold: number;
  ETCOc?: string;
}

interface BilirubinChartProps {
  results: BilirubinResult;
  phototherapyThresholds: any;
  exchangeTransfusionThresholds: any;
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
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -120%)",
        minWidth: "200px",
      }}
    >
      <div className="font-semibold text-gray-800 mb-2">{title}</div>
      <div className="space-y-1">
        {dataPoints.map((point, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: point.color }}
              />
              <span className={point.isPatient ? "font-bold text-red-600" : ""}>
                {point.label}:
              </span>
            </div>
            <span className={point.isPatient ? "font-bold text-red-600" : ""}>
              {point.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BilirubinChart: React.FC<BilirubinChartProps> = ({
  results,
  phototherapyThresholds,
  exchangeTransfusionThresholds,
}) => {
  const t = useTranslations("BilirubinCalculator");
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  // Isolated state - this should not affect parent component
  const [isFullCurveView, setIsFullCurveView] = useState(false);
  const [tooltipState, setTooltipState] = useState<CustomHtmlTooltipProps>({
    visible: false,
    position: { x: 0, y: 0 },
    title: "",
    dataPoints: [],
  });

  // Calculate focused view range - memoized to prevent unnecessary recalculations
  const { minHours, maxHours, minBilirubin, maxBilirubin } = useMemo(() => {
    const patientAge = results.ageInHours;
    const patientBilirubin = results.totalBilirubin;

    if (isFullCurveView) {
      return {
        minHours: 12,
        maxHours: 336,
        minBilirubin: 0,
        maxBilirubin: 30,
      };
    } else {
      // Focused view: ±48 hours around patient age, ±8 mg/dL around patient bilirubin
      const hourRange = 48;
      const bilirubinRange = 8;

      const calcMinHours = Math.max(12, patientAge - hourRange);
      const calcMaxHours = Math.min(336, patientAge + hourRange);
      const calcMinBilirubin = Math.max(0, patientBilirubin - bilirubinRange);
      const calcMaxBilirubin = Math.min(30, patientBilirubin + bilirubinRange);

      // Ensure minimum range
      const finalMaxHours =
        calcMaxHours <= calcMinHours + 24 ? calcMinHours + 72 : calcMaxHours;
      const finalMaxBilirubin =
        calcMaxBilirubin <= calcMinBilirubin + 4
          ? calcMinBilirubin + 10
          : calcMaxBilirubin;

      return {
        minHours: calcMinHours,
        maxHours: finalMaxHours,
        minBilirubin: calcMinBilirubin,
        maxBilirubin: finalMaxBilirubin,
      };
    }
  }, [isFullCurveView, results.ageInHours, results.totalBilirubin]);

  // Generate threshold data for the chart
  const { chartData, patientPoint } = useMemo(() => {
    // Create smooth interpolation function
    const interpolateThreshold = (
      thresholdData: any,
      riskCategory: string,
      targetHour: number
    ) => {
      const categoryData = thresholdData[riskCategory];
      if (!categoryData) return null;
      const availableHours = Object.keys(categoryData)
        .map(Number)
        .sort((a, b) => a - b);

      // Find the two points to interpolate between
      let lowerHour = availableHours[0];
      let upperHour = availableHours[availableHours.length - 1];

      for (let i = 0; i < availableHours.length - 1; i++) {
        if (
          availableHours[i] <= targetHour &&
          availableHours[i + 1] >= targetHour
        ) {
          lowerHour = availableHours[i];
          upperHour = availableHours[i + 1];
          break;
        }
      }

      const lowerValue = categoryData[lowerHour];
      const upperValue = categoryData[upperHour];

      // If we're at exact hour or beyond bounds, return the value
      if (lowerHour === upperHour || targetHour <= lowerHour) {
        return lowerValue;
      }
      if (targetHour >= upperHour) {
        return upperValue;
      }

      // Linear interpolation
      const ratio = (targetHour - lowerHour) / (upperHour - lowerHour);
      return lowerValue + (upperValue - lowerValue) * ratio;
    };

    // Generate data points based on view mode
    const stepSize = isFullCurveView ? 2 : 1; // More dense points in focused view
    const startHour = isFullCurveView ? 12 : Math.max(12, minHours);
    const endHour = isFullCurveView ? 336 : Math.min(336, maxHours);

    const hours = [];
    for (let hour = startHour; hour <= endHour; hour += stepSize) {
      hours.push(hour);
    }

    // Generate phototherapy line data
    const phototherapyData = hours
      .map((hour) => ({
        x: hour,
        y: interpolateThreshold(
          phototherapyThresholds,
          results.riskCategory,
          hour
        ),
      }))
      .filter((point) => point.y !== null);

    // Generate exchange transfusion line data
    const exchangeData = hours
      .map((hour) => ({
        x: hour,
        y: interpolateThreshold(
          exchangeTransfusionThresholds,
          results.riskCategory,
          hour
        ),
      }))
      .filter((point) => point.y !== null);

    // Generate escalation of care line (2 mg/dL below exchange)
    const escalationData = exchangeData.map((point) => ({
      x: point.x,
      y: Math.max(0, point.y - 2),
    }));

    const datasets: ChartDataset<"line">[] = [
      {
        label: t("results.chart.thresholdLines.phototherapy"),
        data: phototherapyData,
        borderColor: "#00BCD4", // Cyan - similar to bilitool
        backgroundColor: "rgba(0, 188, 212, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        fill: "origin",
        tension: 0.4,
      },
      {
        label: t("results.chart.thresholdLines.escalationOfCare"),
        data: escalationData,
        borderColor: "#FFC107", // Amber - similar to bilitool
        backgroundColor: "rgba(255, 193, 7, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        fill: "origin",
        tension: 0.4,
      },
      {
        label: t("results.chart.thresholdLines.exchangeTransfusion"),
        data: exchangeData,
        borderColor: "#F44336", // Red - similar to bilitool
        backgroundColor: "rgba(244, 67, 54, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        fill: "origin",
        tension: 0.4,
      },
      {
        label: t("results.chart.thresholdLines.patient"),
        data: [
          {
            x: results.ageInHours,
            y: results.totalBilirubin,
          },
        ],
        borderColor: "#DC2626", // Red like your growth charts
        backgroundColor: "#DC2626",
        borderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 10,
        showLine: false,
        pointStyle: "rect",
      },
    ];

    const patientPoint = {
      x: results.ageInHours,
      y: results.totalBilirubin,
    };

    return {
      chartData: { datasets },
      patientPoint,
    };
  }, [
    results,
    phototherapyThresholds,
    exchangeTransfusionThresholds,
    t,
    isFullCurveView,
    minHours,
    maxHours,
  ]);

  // Custom tooltip handler
  const externalTooltipHandler = useCallback(
    (context: { chart: ChartJS; tooltip: TooltipModel<"line"> }) => {
      const { chart, tooltip } = context;
      const chartCanvas = chart.canvas;

      if (tooltip.opacity === 0) {
        setTooltipState((prev) => ({ ...prev, visible: false }));
        return;
      }

      const position = {
        x: chartCanvas.offsetLeft + tooltip.caretX,
        y: chartCanvas.offsetTop + tooltip.caretY,
      };

      const hour = chart.scales.x.getValueForPixel(tooltip.caretX);
      if (hour === undefined || hour === null) {
        setTooltipState((prev) => ({ ...prev, visible: false }));
        return;
      }

      const title = t("results.chart.tooltip.age", { hours: Math.round(hour) });
      const dataPoints: CustomTooltipDataPoint[] = [];

      // Add threshold values at this hour
      const datasets = chart.data.datasets;
      datasets.forEach((dataset, index) => {
        if (dataset.label === t("results.chart.thresholdLines.patient")) {
          // Check if patient point is close to hover position
          const patientHour = results.ageInHours;
          if (Math.abs(patientHour - hour) < 6) {
            // Within 6 hours tolerance
            dataPoints.push({
              label: t("results.chart.thresholdLines.patient"),
              value: `${results.totalBilirubin.toFixed(1)} ${t(
                "results.chart.tooltip.mgPerDL"
              )}`,
              color: "#DC2626", // Red like your growth charts
              isPatient: true,
            });
          }
        } else {
          // For threshold lines, interpolate value at current hour
          const data = dataset.data as { x: number; y: number }[];
          if (data.length > 0) {
            // Find closest data points for interpolation
            const sortedData = data.sort((a, b) => a.x - b.x);
            let lowerPoint = sortedData[0];
            let upperPoint = sortedData[sortedData.length - 1];

            for (let i = 0; i < sortedData.length - 1; i++) {
              if (sortedData[i].x <= hour && sortedData[i + 1].x >= hour) {
                lowerPoint = sortedData[i];
                upperPoint = sortedData[i + 1];
                break;
              }
            }

            // Interpolate value
            let value;
            if (lowerPoint.x === upperPoint.x) {
              value = lowerPoint.y;
            } else {
              const ratio =
                (hour - lowerPoint.x) / (upperPoint.x - lowerPoint.x);
              value = lowerPoint.y + (upperPoint.y - lowerPoint.y) * ratio;
            }

            dataPoints.push({
              label: dataset.label || "",
              value: `${value.toFixed(1)} ${t(
                "results.chart.tooltip.mgPerDL"
              )}`,
              color: dataset.borderColor as string,
              isPatient: false,
            });
          }
        }
      });

      // Sort by threshold value (highest first)
      dataPoints.sort((a, b) => {
        const aValue = parseFloat(a.value);
        const bValue = parseFloat(b.value);
        if (a.isPatient) return -1;
        if (b.isPatient) return 1;
        return bValue - aValue;
      });

      setTooltipState({
        visible: true,
        position,
        title,
        dataPoints,
      });
    },
    [results, t]
  );

  // Chart options - stable reference to prevent unnecessary re-renders
  const chartOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          min: minHours,
          max: maxHours,
          title: {
            display: true,
            text: t("results.chart.tooltip.age", { hours: "" }).replace(
              ": ",
              " (hours)"
            ),
            font: { size: 14 },
            color: "#374151",
          },
          ticks: {
            stepSize: isFullCurveView ? 24 : 12,
            callback: function (value) {
              return `${value}h`;
            },
            font: { size: 12 },
            color: "#6B7280",
            maxRotation: 0,
          },
          grid: {
            color: "#E5E7EB",
            lineWidth: 1,
          },
        },
        y: {
          type: "linear",
          min: minBilirubin,
          max: maxBilirubin,
          title: {
            display: true,
            text: `Total Bilirubin (${t("results.chart.tooltip.mgPerDL")})`,
            font: { size: 14 },
            color: "#374151",
          },
          ticks: {
            stepSize: isFullCurveView ? 2 : 1,
            font: { size: 12 },
            color: "#6B7280",
          },
          grid: {
            color: "#E5E7EB",
            lineWidth: 1,
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: { size: 12 },
            boxWidth: 20,
            padding: 15,
            usePointStyle: true,
          },
          onHover: (event, legendItem, legend) => {
            legend.chart.canvas.style.cursor = "pointer";
          },
          onLeave: (event, legendItem, legend) => {
            legend.chart.canvas.style.cursor = "default";
          },
        },
        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
          mode: "index",
          intersect: false,
        },
        annotation: {
          annotations: {
            patientAgeLine: {
              type: "line",
              xMin: results.ageInHours,
              xMax: results.ageInHours,
              borderColor: "#DC2626",
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                content: `${results.ageInHours}h`,
                display: true,
                position: "end",
                yAdjust: -10,
                backgroundColor: "rgba(220, 38, 38, 0.8)",
                color: "white",
                font: { size: 10, weight: "bold" },
              },
            },
          },
        },
      },
      interaction: {
        mode: "index",
        intersect: false,
        axis: "x",
      },
      elements: {
        line: { tension: 0.4 },
        point: { hoverRadius: 8 },
      },
    }),
    [
      results,
      externalTooltipHandler,
      t,
      isFullCurveView,
      minHours,
      maxHours,
      minBilirubin,
      maxBilirubin,
    ]
  );

  // Handle view toggle with event prevention
  const handleViewToggle = useCallback((viewType: "focused" | "full") => {
    // Prevent any potential event bubbling
    setIsFullCurveView(viewType === "full");
  }, []);

  const getRiskStatusColor = () => {
    if (results.totalBilirubin >= results.exchangeTransfusionThreshold) {
      return "bg-red-100 text-red-800 border-red-200";
    } else if (results.totalBilirubin >= results.escalationOfCareThreshold) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    } else if (results.totalBilirubin >= results.phototherapyThreshold) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getRiskStatusText = () => {
    if (results.totalBilirubin >= results.exchangeTransfusionThreshold) {
      return t("results.chart.riskStatus.exchangeTransfusionRequired");
    } else if (results.totalBilirubin >= results.escalationOfCareThreshold) {
      return t("results.chart.riskStatus.escalationOfCareRequired");
    } else if (results.totalBilirubin >= results.phototherapyThreshold) {
      return t("results.chart.riskStatus.phototherapyRequired");
    } else {
      return t("results.chart.riskStatus.belowTreatmentThreshold");
    }
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xl font-semibold text-gray-800">
            {t("results.chart.title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getRiskStatusColor()} font-semibold`}>
              {getRiskStatusText()}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button" // Explicitly set type to prevent form submission
            variant={isFullCurveView ? "outline" : "default"}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleViewToggle("focused");
            }}
            className="text-xs"
          >
            {t("chart.focusedView")}
          </Button>
          <Button
            type="button" // Explicitly set type to prevent form submission
            variant={isFullCurveView ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleViewToggle("full");
            }}
            className="text-xs"
          >
            {t("chart.fullCurve")}
          </Button>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {t("results.chart.patientInfo", {
            hours: results.ageInHours,
            weeks: results.gestationalAge,
            riskFactors: results.hasRiskFactors
              ? t("results.patientSummary.yes")
              : t("results.patientSummary.no"),
          }).replace("{mg/dL}", `${results.totalBilirubin} mg/dL`)}
        </div>
      </CardHeader>
      <CardContent className="relative !pt-0">
        <div className="h-96 w-full relative">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
          <CustomHtmlTooltip {...tooltipState} />
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          {t("results.chart.dataSource")}
        </div>
      </CardContent>
    </Card>
  );
};
