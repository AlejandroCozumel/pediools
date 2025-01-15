import cdcBmiData from "@/app/data/cdc-data-bmi.json";
import whoHeadData from "@/app/data/who-data-head.json";

import { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RangeIndicator as RangeIndicatorInput } from "@/components/RangeIndicator";
import { cn } from "@/lib/utils";
import { differenceInMonths } from "date-fns";
import { useTranslations } from "next-intl";

// Raw data type from JSON
interface RawCDCDataPoint {
  Sex: string | number;
  Agemos: string | number;
  L?: string | number;
  M?: string | number;
  S?: string | number;
  P3: string | number;
  P5?: string | number;
  P10?: string | number;
  P25?: string | number;
  P50: string | number;
  P75?: string | number;
  P90?: string | number;
  P95?: string | number;
  P97: string | number;
}

// Processed data type
interface CDCDataPoint {
  Sex: number;
  Agemos: number;
  P3: number;
  P50: number;
  P97: number;
}

interface WHOWeightDataPoint {
  Sex: number;
  Agemos: number;
  L: number;
  M: number;
  S: number;
  P01: number;
  P1: number;
  P3: number;
  P5: number;
  P10: number;
  P15: number;
  P25: number;
  P50: number;
  P75: number;
  P85: number;
  P90: number;
  P95: number;
  P97: number;
  P99: number;
  P999: number;
}

interface WHOHeightDataPoint {
  Sex: number;
  Agemos: number;
  L: number;
  M: number;
  S: number;
  SD: number;
  P01: number;
  P1: number;
  P3: number;
  P5: number;
  P10: number;
  P15: number;
  P25: number;
  P50: number;
  P75: number;
  P85: number;
  P90: number;
  P95: number;
  P97: number;
  P99: number;
  P999: number;
}

interface MeasurementInputProps {
  label: string;
  field: any;
  icon: LucideIcon;
  gender: "male" | "female";
  birthDate: Date;
  measurementDate?: Date;
  selectedStandard?: string;
  cdcChildWeightData?: object[];
  cdcChildHeightData?: object[];
  cdcInfantWeightData?: object[];
  cdcInfantHeightData?: object[];
  cdcInfantHeightHead?: object[];
  whoWeightData?: WHOWeightDataPoint[];
  whoHeightData?: WHOHeightDataPoint[];
  whoHeadData?: WHOWeightDataPoint[];
}

// Helper function to parse CDC data
function parseCDCData(data: RawCDCDataPoint[]): CDCDataPoint[] {
  return data.map((point) => ({
    Sex: Number(point.Sex),
    Agemos: Number(point.Agemos),
    P3: Number(point.P3),
    P50: Number(point.P50),
    P97: Number(point.P97),
  }));
}

function interpolateValue(
  ageInMonths: number,
  dataPoints: CDCDataPoint[]
): CDCDataPoint {
  // Sort points by their distance to target age
  const sortedPoints = dataPoints.sort(
    (a, b) =>
      Math.abs(a.Agemos - ageInMonths) - Math.abs(b.Agemos - ageInMonths)
  );

  const point1 = sortedPoints[0];
  const point2 = sortedPoints[1];

  // If exact match or same points, return closest
  if (point1.Agemos === point2.Agemos || point1.Agemos === ageInMonths) {
    return point1;
  }

  // Calculate interpolation factor
  const factor =
    (ageInMonths - point1.Agemos) / (point2.Agemos - point1.Agemos);

  // Return interpolated values
  return {
    Sex: point1.Sex,
    Agemos: ageInMonths,
    P3: point1.P3 + (point2.P3 - point1.P3) * factor,
    P50: point1.P50 + (point2.P50 - point1.P50) * factor,
    P97: point1.P97 + (point2.P97 - point1.P97) * factor,
  };
}

export default function MeasurementInput({
  label,
  field,
  icon: Icon,
  gender,
  birthDate,
  measurementDate,
  selectedStandard,
  cdcChildWeightData,
  cdcChildHeightData,
  cdcInfantWeightData,
  cdcInfantHeightData,
  whoWeightData,
  whoHeightData,
  cdcInfantHeightHead,
  whoHeadData,
}: MeasurementInputProps) {
  const t = useTranslations("GrowthForm");

  // Ensure consistent date handling
  const safeBirthDate = birthDate
    ? new Date(
        birthDate.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate() || 1
      )
    : null;
  const safeMeasurementDate = measurementDate
    ? new Date(
        measurementDate.getFullYear(),
        measurementDate.getMonth(),
        measurementDate.getDate() || 1
      )
    : null;

  const ageInMonths =
    safeBirthDate && safeMeasurementDate
      ? differenceInMonths(safeMeasurementDate, safeBirthDate)
      : 0;

  let range;
  let rawData;

  // Select dataset based on standard and label
  switch (selectedStandard) {
    case "cdc_infant":
      if (label === t("measurementInputs.weight")) {
        rawData = cdcInfantWeightData;
      } else if (label === t("measurementInputs.height")) {
        rawData = cdcInfantHeightData;
      } else if (label === t("measurementInputs.headCircumference")) {
        rawData = cdcInfantHeightHead;
      }
      break;
    case "cdc_child":
      if (label === t("measurementInputs.weight")) {
        rawData = cdcChildWeightData;
      } else if (label === t("measurementInputs.height")) {
        rawData = cdcChildHeightData;
      } else if (label === t("measurementInputs.bmi")) {
        rawData = cdcBmiData;
      }
      break;
    case "who":
      if (label === t("measurementInputs.weight")) {
        rawData = whoWeightData;
      } else if (label === t("measurementInputs.height")) {
        rawData = whoHeightData;
      } else if (label === t("measurementInputs.headCircumference")) {
        rawData = whoHeadData;
      }
      break;
    default:
      // Fallback to child data or null
      rawData =
        label === t("measurementInputs.weight")
          ? cdcChildWeightData
          : label === t("measurementInputs.height")
          ? cdcChildHeightData
          : label === t("measurementInputs.bmi")
          ? cdcBmiData
          : label === t("measurementInputs.headCircumference") &&
            selectedStandard === "cdc_infant"
          ? cdcInfantHeightHead
          : label === t("measurementInputs.headCircumference") &&
            selectedStandard === "who"
          ? whoHeadData
          : null;
  }

  // Check age ranges for the selected standard
  switch (selectedStandard) {
    case "who":
      if (ageInMonths >= 0 && ageInMonths <= 24) {
        const sex = gender === "male" ? 1 : 2;
        if (rawData) {
          const data = rawData as WHOWeightDataPoint[];
          const dataPoints = data.filter((point) => point.Sex === sex);
          const interpolated = interpolateValue(ageInMonths, dataPoints);
          range = {
            min: interpolated.P3,
            max: interpolated.P97,
            normal: interpolated.P50,
          };
        }
      }
      break;
    case "cdc_child":
      if (ageInMonths >= 24 && ageInMonths <= 240) {
        const sex = gender === "male" ? 1 : 2;
        if (rawData) {
          const data = parseCDCData(rawData as RawCDCDataPoint[]);
          const dataPoints = data.filter((point) => point.Sex === sex);
          const interpolated = interpolateValue(ageInMonths, dataPoints);
          range = {
            min: interpolated.P3,
            max: interpolated.P97,
            normal: interpolated.P50,
          };
        }
      }
      break;
    case "cdc_infant":
      if (
        label === t("measurementInputs.headCircumference") ||
        ageInMonths <= 36
      ) {
        const sex = gender === "male" ? 1 : 2;
        if (rawData) {
          const data = parseCDCData(rawData as RawCDCDataPoint[]);
          const dataPoints = data.filter((point) => point.Sex === sex);
          const interpolated = interpolateValue(ageInMonths, dataPoints);
          range = {
            min: interpolated.P3,
            max: interpolated.P97,
            normal: interpolated.P50,
          };
        }
      }
      break;

    // Add more cases for other standards as needed

    default:
      // Handle unknown standards or set a default behavior
      break;
  }

  const value = parseFloat(field.value || "0");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^-?\d*\.?\d*$/.test(value)) {
      field.onChange(e);
    }
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="space-y-2 flex flex-col gap-1">
        <FormControl>
          <div className="relative">
            <Input
              {...field}
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              onChange={handleChange}
              className="pl-8 border-medical-100"
            />
            <Icon
              className={cn(
                "absolute left-2 top-2.5 h-4 w-4 transition-colors duration-300 ease-in-out",
                gender === "male" ? "text-medical-500" : "text-medical-pink-500"
              )}
            />
          </div>
        </FormControl>
        {field.value && !isNaN(value) && range && (
          <RangeIndicatorInput
            value={value}
            min={range.min}
            max={range.max}
            normal={range.normal}
          />
        )}
      </div>
      <FormMessage />
    </FormItem>
  );
}
