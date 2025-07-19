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
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: point.color }}
              />
              <span className={point.isPatient ? "font-bold text-red-600" : ""}>{point.label}:</span>
            </div>
            <span className={point.isPatient ? "font-bold text-red-600" : ""}>{point.value}</span>
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
  const chartRef = useRef<ChartJS<"line"> | null>(null);
  const [tooltipState, setTooltipState] = useState<CustomHtmlTooltipProps>({
    visible: false,
    position: { x: 0, y: 0 },
    title: "",
    dataPoints: [],
  });

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

      const availableHours = Object.keys(categoryData).map(Number).sort((a, b) => a - b);

      // Find the two points to interpolate between
      let lowerHour = availableHours[0];
      let upperHour = availableHours[availableHours.length - 1];

      for (let i = 0; i < availableHours.length - 1; i++) {
        if (availableHours[i] <= targetHour && availableHours[i + 1] >= targetHour) {
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

    // Generate dense data points for smooth curves (every 2 hours)
    const hours = Array.from({ length: 163 }, (_, i) => i * 2 + 12); // 12, 14, 16, ... 336 hours

    // Generate phototherapy line data
    const phototherapyData = hours.map(hour => ({
      x: hour,
      y: interpolateThreshold(phototherapyThresholds, results.riskCategory, hour)
    })).filter(point => point.y !== null);

    // Generate exchange transfusion line data
    const exchangeData = hours.map(hour => ({
      x: hour,
      y: interpolateThreshold(exchangeTransfusionThresholds, results.riskCategory, hour)
    })).filter(point => point.y !== null);

    // Generate escalation of care line (2 mg/dL below exchange)
    const escalationData = exchangeData.map(point => ({
      x: point.x,
      y: Math.max(0, point.y - 2)
    }));

    const datasets: ChartDataset<"line">[] = [
      {
        label: "Phototherapy",
        data: phototherapyData,
        borderColor: "#00BCD4", // Cyan - similar to bilitool
        backgroundColor: "rgba(0, 188, 212, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        fill: "origin",
        tension: 0.4,
      },
      {
        label: "Escalation of Care",
        data: escalationData,
        borderColor: "#FFC107", // Amber - similar to bilitool
        backgroundColor: "rgba(255, 193, 7, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        fill: "origin",
        tension: 0.4,
      },
      {
        label: "Exchange Transfusion",
        data: exchangeData,
        borderColor: "#F44336", // Red - similar to bilitool
        backgroundColor: "rgba(244, 67, 54, 0.1)",
        borderWidth: 3,
        pointRadius: 0,
        fill: "origin",
        tension: 0.4,
      },
      {
        label: "Patient",
        data: [{
          x: results.ageInHours,
          y: results.totalBilirubin
        }],
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
  }, [results, phototherapyThresholds, exchangeTransfusionThresholds]);

  // Custom tooltip handler
  const externalTooltipHandler = useCallback(
    (context: { chart: ChartJS; tooltip: TooltipModel<"line"> }) => {
      const { chart, tooltip } = context;
      const chartCanvas = chart.canvas;

      if (tooltip.opacity === 0) {
        setTooltipState(prev => ({ ...prev, visible: false }));
        return;
      }

      const position = {
        x: chartCanvas.offsetLeft + tooltip.caretX,
        y: chartCanvas.offsetTop + tooltip.caretY,
      };

      const hour = chart.scales.x.getValueForPixel(tooltip.caretX);
      if (hour === undefined || hour === null) {
        setTooltipState(prev => ({ ...prev, visible: false }));
        return;
      }

      const title = `Age: ${Math.round(hour)} hours`;
      const dataPoints: CustomTooltipDataPoint[] = [];

      // Add threshold values at this hour
      const datasets = chart.data.datasets;
      datasets.forEach((dataset, index) => {
        if (dataset.label === "Patient") {
          // Check if patient point is close to hover position
          const patientHour = results.ageInHours;
          if (Math.abs(patientHour - hour) < 6) { // Within 6 hours tolerance
            dataPoints.push({
              label: "Patient",
              value: `${results.totalBilirubin.toFixed(1)} mg/dL`,
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
              const ratio = (hour - lowerPoint.x) / (upperPoint.x - lowerPoint.x);
              value = lowerPoint.y + (upperPoint.y - lowerPoint.y) * ratio;
            }

            dataPoints.push({
              label: dataset.label || "",
              value: `${value.toFixed(1)} mg/dL`,
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
    [results]
  );

  // Chart options
  const chartOptions: ChartOptions<"line"> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        min: 12,
        max: 336,
        title: {
          display: true,
          text: "Age (hours)",
          font: { size: 14 },
          color: "#374151",
        },
        ticks: {
          stepSize: 24,
          callback: function(value) {
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
        min: 0,
        max: 30,
        title: {
          display: true,
          text: "Total Bilirubin (mg/dL)",
          font: { size: 14 },
          color: "#374151",
        },
        ticks: {
          stepSize: 2,
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
          // Change cursor to pointer on hover
          legend.chart.canvas.style.cursor = 'pointer';
        },
        onLeave: (event, legendItem, legend) => {
          // Reset cursor when leaving legend
          legend.chart.canvas.style.cursor = 'default';
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
            borderColor: "#DC2626", // Red like your growth charts
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: `${results.ageInHours}h`,
              display: true,
              position: "end",
              yAdjust: -10,
              backgroundColor: "rgba(220, 38, 38, 0.8)", // Red background
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
      axis: "x"
    },
    elements: {
      line: { tension: 0.4 },
      point: { hoverRadius: 8 },
    },
  }), [results, externalTooltipHandler]);

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
      return "Exchange Transfusion Required";
    } else if (results.totalBilirubin >= results.escalationOfCareThreshold) {
      return "Escalation of Care Required";
    } else if (results.totalBilirubin >= results.phototherapyThreshold) {
      return "Phototherapy Required";
    } else {
      return "Below Treatment Threshold";
    }
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xl font-semibold text-gray-800">
            BiliGraph Thresholds
          </CardTitle>
          <Badge className={`${getRiskStatusColor()} font-semibold`}>
            {getRiskStatusText()}
          </Badge>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          <span className="font-medium">{results.totalBilirubin} mg/dL</span> @ <span className="font-medium">{results.ageInHours} hours</span> |
          GA: <span className="font-medium">{results.gestationalAge} weeks</span> |
          Neurotox risk factors: <span className="font-medium">{results.hasRiskFactors ? "Yes" : "No"}</span>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="h-96 w-full relative">
          <Line
            ref={chartRef}
            data={chartData}
            options={chartOptions}
          />
          <CustomHtmlTooltip {...tooltipState} />
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          Based on AAP 2022 Clinical Practice Guidelines for Hyperbilirubinemia
        </div>
      </CardContent>
    </Card>
  );
};