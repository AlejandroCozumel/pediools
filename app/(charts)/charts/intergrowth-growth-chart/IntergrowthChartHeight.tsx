"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import cdcData from "@/app/data/intergrowht-lenght.json";

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  payload: DataPoint;
  color: string;
}

interface DataPoint {
  age: string;
  "3rd": number;
  "5th": number;
  "10th": number;
  "50th": number;
  "90th": number;
  "95th": number;
  "97th": number;
  patientValue?: number | null | undefined;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number;
}

interface CustomizedDotProps {
  cx?: number;
  cy?: number;
  payload?: DataPoint;
  value?: number;
}

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

interface PatientMeasurement {
  gestationalAge: number;
  gestationalDays: number;
  value: number;
  percentiles: {
    P3: number;
    P5: number;
    P10: number;
    P50: number;
    P90: number;
    P95: number;
    P97: number;
    calculatedPercentile: number;
  };
}

interface ChartData {
  data: DataPoint[];
  patientData: PatientMeasurement;
  originalInput: {
    gender: "male" | "female";
  };
}

const CustomizedDot: React.FC<CustomizedDotProps> = (props) => {
  const { cx, cy, payload, value } = props;

  // Only render the dot if there's a patient value and we have valid coordinates
  if (value && cx !== undefined && cy !== undefined) {
    return (
      <g>
        {/* Larger outer circle for emphasis */}
        <circle
          cx={cx}
          cy={cy}
          r={10} // Significantly larger touch area
          fill="rgba(220, 38, 38, 0.2)"
          style={{ cursor: "pointer" }} // Indicate it's interactive
        />
        {/* Smaller visual dot */}
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#DC2626"
          stroke="#991B1B"
          strokeWidth={2}
        />
      </g>
    );
  }
  return null;
};

const IntergrowthChartHeight = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const [isMediumScreen, setIsMediumScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMediumScreen(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  function findClosestDataPoint(
    ageInMonths: number,
    gender: "male" | "female",
    cdcData: CDCDataPoint[],
    type: "weight" | "height"
  ): CDCDataPoint {
    const sex = gender === "male" ? 1 : 2;
    const filteredData = cdcData.filter(
      (point) =>
        point.Sex === sex &&
        (type === "height"
          ? point.Agemos >= 0 && point.Agemos <= 24
          : point.Agemos >= 0 && point.Agemos <= 24)
    );

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

    const interpolatedPoint = {
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

    return interpolatedPoint;
  }

  const generateFullCurveData = (
    intergrowthData: any[],
    gender: "male" | "female",
    patientMeasurement: any
  ): DataPoint[] => {
    // Validate inputs
    if (!intergrowthData || !gender || !patientMeasurement) {
      console.error("Invalid data for curve generation");
      return [];
    }

    const sex = gender === "male" ? 1 : 2;
    const filteredData = intergrowthData.filter((point) => point.sex === sex);

    // Default data generation
    let allData = filteredData.map((point) => ({
      age: point.age,
      "3rd": point["3rd"],
      "5th": point["5th"],
      "10th": point["10th"],
      "50th": point["50th"],
      "90th": point["90th"],
      "95th": point["95th"],
      "97th": point["97th"],
      patientValue: undefined,
    }));

    // Safely add patient data point
    try {
      // Check if patient measurement exists and has a value
      if (patientMeasurement && patientMeasurement.value !== undefined) {
        const patientValue = patientMeasurement.value;
        const ageString = `${patientMeasurement.gestationalAge}+${patientMeasurement.gestationalDays}`;

        const existingPointIndex: number | undefined = allData.findIndex(
          (point) => point.age === ageString
        );
        //Fix this
        if (existingPointIndex !== -1 && !isNaN(patientValue)) {
          allData[existingPointIndex].patientValue = patientValue;
        } else {
          console.warn("Could not add patient value:", {
            existingPointIndex,
            patientValue,
            isNaN: isNaN(patientValue),
          });
        }
      } else {
        console.warn("No valid patient measurement found");
      }
    } catch (err) {
      console.error("Error adding patient value:", err);
    }

    return allData;
  };

  useEffect(() => {
    // Only run on client side
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const weightData = searchParams.get("weightData");
        const heightData = searchParams.get("heightData");

        if (!weightData || !heightData) {
          throw new Error("Weight and height data are required");
        }

        const response = await fetch(
          `/api/charts/intergrowth-growth-chart?weightData=${weightData}&heightData=${heightData}`
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load chart data");
        }

        // More robust data processing
        const fullCurveData = generateFullCurveData(
          cdcData,
          result.originalInput.height.gender,
          result.data.height[0]
        );

        setChartData({
          data: fullCurveData,
          patientData: result.data.height[0],
          originalInput: result.originalInput.height,
        });
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data on the client side
    if (typeof window !== "undefined") {
      fetchData();
    }
  }, [searchParams]);

  if (typeof window === "undefined" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-600" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-600" />
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-600 bg-red-50 px-6 py-4 rounded-lg shadow-sm border border-red-100">
          <p className="font-medium">Error Loading Chart</p>
          <p className="mt-1 text-sm">{error || "Failed to load chart"}</p>
        </div>
      </div>
    );
  }

  const patientData = chartData.patientData;
  const patientAge = patientData
    ? patientData.gestationalAge + patientData.gestationalDays / 7
    : null;
  const calculatedPercentile = patientData?.percentiles?.calculatedPercentile;

  const percentileColors = {
    "3rd": "#93C5FD",
    "5th": "#60A5FA",
    "10th": "#3B82F6",
    "50th": "#1D4ED8",
    "90th": "#1E40AF",
    "95th": "#172554",
    "97th": "#172554",
  };

  const CustomTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
  }) => {
    if (active && payload && payload.length) {
      const weeks = Math.floor(label as number);
      const days = Math.round(((label as number) % 1) * 7);

      const sortedPayload = [...payload].sort((a, b) => {
        const getPercentile = (key: string) => {
          if (key === "patientValue") {
            return calculatedPercentile ?? 0;
          }
          return Number(key.replace(/[^\d.]/g, ""));
        };
        return getPercentile(b.dataKey) - getPercentile(a.dataKey);
      });

      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg">
          <p className="font-semibold text-gray-900 mb-2">
            Gestational Age: {weeks} weeks {days} days
          </p>
          <div className="space-y-1">
            {sortedPayload.map((entry: TooltipPayloadItem) => (
              <p
                key={entry.dataKey}
                className={`flex justify-between gap-4 ${
                  entry.dataKey === "patientValue"
                    ? "font-bold text-red-600"
                    : ""
                }`}
              >
                <span
                  style={{
                    color:
                      entry.dataKey === "patientValue"
                        ? "#DC2626"
                        : entry.color,
                  }}
                  className={
                    entry.dataKey === "patientValue"
                      ? "font-bold"
                      : "font-medium"
                  }
                >
                  {`${
                    entry.dataKey === "patientValue"
                      ? "P" + calculatedPercentile?.toFixed(1)
                      : entry.dataKey
                  } Percentile`}
                  :
                </span>
                <span
                  className={
                    entry.dataKey === "patientValue"
                      ? "font-bold text-red-600"
                      : ""
                  }
                >
                  {entry.value.toFixed(2)} cm
                </span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const processedData = chartData.data.map((point) => {
    const [weeks, days] = point.age.split("+").map(Number);

    // Use a smooth interpolation that preserves the curve
    const numericAge = weeks + days / 7;

    return {
      ...point,
      numericAge: numericAge,
      displayWeeks: weeks,
      displayDays: days,
    };
  });

  const minWeeks = Math.min(
    ...processedData.map((point) => {
      const [weeks] = point.age.split("+").map(Number);
      return weeks;
    })
  );

  const maxWeeks = Math.max(
    ...processedData.map((point) => {
      const [weeks] = point.age.split("+").map(Number);
      return weeks;
    })
  );

  const xAxisTicks = Array.from(
    { length: Math.ceil((maxWeeks - minWeeks) / 2) + 1 },
    (_, i) => minWeeks + i * 2
  );
  const xAxisTicksMobile = Array.from(
    { length: Math.ceil((maxWeeks - minWeeks) / 4) + 1 },
    (_, i) => minWeeks + i * 4
  );

  const yAxisTicks = Array.from({ length: 9 }, (_, i) => 20 + i * 5); // 20 to 60 cm by 5
const yAxisTicksMobile = Array.from({ length: 5 }, (_, i) => 20 + i * 10); // 20 to 60 cm by 10

  return (
    <div className="w-full">
      <Card className="bg-white shadow-lg group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-medical-10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="relative space-y-4 pb-3 md:pb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-start bg-gradient-to-r from-medical-700 to-medical-900 bg-clip-text text-transparent text-base md:text-lg lg:text-xl font-bold tracking-tight">
                {chartData.originalInput.gender === "male" ? "Boys" : "Girls"}{" "}
                <span className="block text-sm md:text-base text-medical-90 font-medium">
                  Height For Age Chart
                </span>
              </CardTitle>
              <div className="flex gap-4">
                <div>
                  {chartData.patientData.value && (
                    <Badge variant="outline">
                      Height: {chartData.patientData.value} cm
                    </Badge>
                  )}
                </div>
                <div>
                  {calculatedPercentile && (
                    <Badge variant="outline">
                      {calculatedPercentile.toFixed(2)}th percentile
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full h-96 md:h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processedData}
                margin={{ top: 30, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  strokeOpacity={0.8}
                />
                <XAxis
                  dataKey="numericAge"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  interval={0}
                  ticks={isMediumScreen ? xAxisTicks : xAxisTicksMobile}
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    // Convert to whole weeks
                    return `${Math.floor(value)}`;
                  }}
                  label={{
                    value: "Gestational Age (weeks)",
                    position: "bottom",
                    offset: 0,
                    style: { fill: "#374151", fontSize: 14 },
                  }}
                />
                <YAxis
                  domain={[20, 60]}
                  ticks={isMediumScreen ? yAxisTicks : yAxisTicksMobile}
                  stroke="#6B7280"
                  interval={0}
                  width={isMediumScreen ? 60 : 30}
                  tick={{ fontSize: 12 }}
                  label={
                    isMediumScreen
                      ? {
                          value: "Height (cm)",
                          angle: -90,
                          position: "insideLeft",
                          offset: 10,
                          style: { fill: "#374151", fontSize: 14 },
                        }
                      : undefined
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                  }}
                  iconType="plainline"
                />

                {Object.entries(percentileColors).map(([percentile, color]) => (
                  <Line
                    key={percentile}
                    type="monotone"
                    dataKey={percentile}
                    name={`${percentile} Percentile`}
                    stroke={color}
                    strokeWidth={percentile === "50th" ? 2 : 1}
                    dot={false}
                    strokeOpacity={0.8}
                  />
                ))}

                {patientAge && (
                  <ReferenceLine
                    x={patientAge}
                    stroke="#DC2626"
                    strokeDasharray="3 3"
                    label={{
                      value: "Current Age",
                      position: "top",
                      offset: 15,
                      fill: "#DC2626",
                      fontSize: 13,
                      fontWeight: "bold",
                    }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="patientValue"
                  name="Patient Measurement"
                  stroke="#DC2626"
                  dot={<CustomizedDot />}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>

        <CardFooter className="border-t border-gray-100">
          <p className="text-xs text-gray-500 mt-4">
            Data source: Intergrowth-21st Preterm Growth Standards
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default IntergrowthChartHeight;
