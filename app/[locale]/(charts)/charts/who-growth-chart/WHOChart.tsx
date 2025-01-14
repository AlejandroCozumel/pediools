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
import cdcData from "@/app/data/who-data-weight.json";

interface TooltipPayloadItem {
  dataKey: string;
  name: string;
  value: number;
  payload: DataPoint;
  color: string;
}

interface DataPoint {
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
  patientValue?: number | null;
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
  ageInMonths: number;
  weight?: {
    value: number;
    percentiles: {
      calculatedPercentile: number;
      [key: string]: number;
    };
  };
}

interface ChartProps {
  data: {
    success: boolean;
    originalInput: {
      weight: {
        gender: "male" | "female";
      };
    };
    data: {
      weight: Array<{
        ageInMonths: number;
        weight: {
          value: number;
          percentiles: {
            calculatedPercentile: number;
          };
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

const WHOChart = ({ data }: ChartProps) => {
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
        (type === "weight"
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
    cdcData: CDCDataPoint[],
    gender: "male" | "female",
    patientMeasurement: PatientMeasurement | undefined
  ): DataPoint[] => {
    const sex = gender === "male" ? 1 : 2;
    // Create a more dense set of ages from 0 to 24 months
    const ages = Array.from({ length: 25 }, (_, i) => i);

    // Filter data by sex first
    const filteredData = cdcData.filter((point) => point.Sex === sex);

    let allData = ages.map((age) => {
      // Find the CDC data point for this exact age in months
      const dataPoint = findClosestDataPoint(
        age,
        gender,
        filteredData,
        "weight"
      );
      return {
        age: Number(age.toFixed(2)),
        P3: Number(dataPoint.P3.toFixed(2)),
        P5: Number(dataPoint.P5.toFixed(2)),
        P10: Number(dataPoint.P10.toFixed(2)),
        P25: Number(dataPoint.P25.toFixed(2)),
        P50: Number(dataPoint.P50.toFixed(2)),
        P75: Number(dataPoint.P75.toFixed(2)),
        P90: Number(dataPoint.P90.toFixed(2)),
        P95: Number(dataPoint.P95.toFixed(2)),
        P97: Number(dataPoint.P97.toFixed(2)),
        patientValue: undefined,
      } as DataPoint;
    });

    // Add patient data point if exists
    if (patientMeasurement?.weight) {
      const patientAge = patientMeasurement.ageInMonths;
      // Find or create a data point for the patient's exact age
      const existingPointIndex = allData.findIndex(
        (point) => Math.abs(point.age - patientAge) < 0.01
      );

      if (existingPointIndex !== -1) {
        // Update existing point
        (allData[existingPointIndex] as DataPoint).patientValue =
          patientMeasurement.weight.value;
      } else {
        // Insert new point
        const newPoint: DataPoint = {
          age: patientAge,
          P3: 0,
          P5: 0,
          P10: 0,
          P25: 0,
          P50: 0,
          P75: 0,
          P90: 0,
          P95: 0,
          P97: 0,
          patientValue: patientMeasurement.weight.value,
        };

        // Find insertion point
        const insertIndex = allData.findIndex(
          (point) => point.age > patientAge
        );

        if (insertIndex !== -1) {
          // Interpolate percentile values
          const before = allData[insertIndex - 1];
          const after = allData[insertIndex];
          const ratio = (patientAge - before.age) / (after.age - before.age);

          newPoint.P3 = before.P3 + (after.P3 - before.P3) * ratio;
          newPoint.P5 = before.P5 + (after.P5 - before.P5) * ratio;
          newPoint.P10 = before.P10 + (after.P10 - before.P10) * ratio;
          newPoint.P25 = before.P25 + (after.P25 - before.P25) * ratio;
          newPoint.P50 = before.P50 + (after.P50 - before.P50) * ratio;
          newPoint.P75 = before.P75 + (after.P75 - before.P75) * ratio;
          newPoint.P90 = before.P90 + (after.P90 - before.P90) * ratio;
          newPoint.P95 = before.P95 + (after.P95 - before.P95) * ratio;
          newPoint.P97 = before.P97 + (after.P97 - before.P97) * ratio;

          allData.splice(insertIndex, 0, newPoint);
        }
      }
    }

    return allData;
  };

  const fullCurveData = generateFullCurveData(
    cdcData,
    data.originalInput.weight.gender,
    data.data.weight[0]
  );

  const chartData = {
    data: fullCurveData,
    patientData: data.data.weight[0],
    originalInput: data.originalInput.weight,
  };

  const patientAge = chartData.patientData
    ? chartData.patientData.ageInMonths
    : null;
  const calculatedPercentile =
    chartData.patientData?.weight?.percentiles?.calculatedPercentile;

  const percentileColors = {
    P3: "#93C5FD", // blue-300
    P5: "#60A5FA", // blue-400
    P10: "#3B82F6", // blue-500
    P25: "#2563EB", // blue-600
    P50: "#1D4ED8", // blue-700
    P75: "#1E40AF", // blue-800
    P90: "#1E3A8A", // blue-900
    P95: "#172554", // blue-950
    P97: "#172554", // blue-950
  };

  const CustomTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
  }) => {
    if (active && payload && payload.length) {
      const sortedPayload = [...payload].sort((a, b) => {
        const getPercentile = (key: string) => {
          if (key === "patientValue") {
            return calculatedPercentile ?? 0;
          }
          return Number(key.slice(1));
        };
        return getPercentile(b.dataKey) - getPercentile(a.dataKey);
      });
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg">
          <p className="font-semibold text-gray-900 mb-2">
            Age: {Number(label)} months
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
                  className={`${
                    entry.dataKey === "patientValue"
                      ? "font-bold"
                      : "font-medium"
                  }`}
                >
                  {`${
                    entry.dataKey === "patientValue"
                      ? "P" + calculatedPercentile?.toFixed(1)
                      : entry.dataKey
                  }th Percentile`}
                  :
                </span>
                <span
                  className={`${
                    entry.dataKey === "patientValue"
                      ? "font-bold text-red-600"
                      : ""
                  }`}
                >
                  {entry.value.toFixed(1)} kg
                </span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const xAxisTicks = Array.from({ length: 13 }, (_, i) => i * 2); // 0 to 24
  const xAxisTicksMobile = Array.from({ length: 7 }, (_, i) => i * 4); // 0 to 24 every 2
  const yAxisTicks = Array.from({ length: 11 }, (_, i) => i * 2); // 0 to 20 kilos by 2s
  const yAxisTicksMobile = Array.from({ length: 6 }, (_, i) => i * 4); // 0 to 20 kilos by 4s

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
                  Weight For Age Chart
                </span>
              </CardTitle>
              <div className="flex gap-4">
                <div>
                  {chartData.patientData?.weight && (
                    <Badge variant="outline">
                      Weight: {chartData.patientData.weight.value} kg
                    </Badge>
                  )}
                </div>
                <div>
                  {calculatedPercentile && (
                    <Badge variant="outline">
                      {calculatedPercentile.toFixed(1)}th percentile
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
                data={chartData.data}
                margin={{ top: 30, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  strokeOpacity={0.8}
                />
                <XAxis
                  dataKey="age"
                  type="number"
                  domain={[0, 24]}
                  interval={0}
                  ticks={isMediumScreen ? xAxisTicks : xAxisTicksMobile}
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Age (months)",
                    position: "bottom",
                    offset: 0,
                    style: { fill: "#374151", fontSize: 14 },
                  }}
                />
                <YAxis
                  domain={[0, 20]}
                  ticks={isMediumScreen ? yAxisTicks : yAxisTicksMobile}
                  stroke="#6B7280"
                  interval={0}
                  width={isMediumScreen ? 60 : 30}
                  tick={{ fontSize: 12 }}
                  label={
                    isMediumScreen
                      ? {
                          value: "Weight (kg)",
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
                    name={`${percentile.slice(1)}th Percentile`}
                    stroke={color}
                    strokeWidth={percentile === "P50" ? 2 : 1}
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
            Data source: WHO Growth Standards for infants (0-24 months)
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WHOChart;