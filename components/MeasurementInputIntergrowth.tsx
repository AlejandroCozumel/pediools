import { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RangeIndicator } from "@/components/RangeIndicator";
import { cn } from "@/lib/utils";
import intergrowthWeightData from "@/app/data/intergrowht-weight.json";
import intergrowthlenghtData from "@/app/data/intergrowht-lenght.json";
import intergrowthHeadData from "@/app/data/intergrowht-head.json";

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

interface MeasurementInputIntergrowthProps {
  label: string;
  field: any;
  icon: LucideIcon;
  gender: "male" | "female";
  selectedStandard?: string;
  gestationalWeeks?: string;
  gestationalDays?: string;
}

function getIntergrowthData(
  gender: "male" | "female",
  weeks: string,
  days: string,
  type: "weight" | "length" | "head"
): IntergrowthDataPoint | undefined {
  const sex = gender === "male" ? 1 : 2;
  const data =
    type === "weight"
      ? intergrowthWeightData
      : type === "length"
      ? intergrowthlenghtData
      : intergrowthHeadData;
  const gestationalAge = `${weeks}+${days}`;

  return data.find(
    (point) => point.sex === sex && point.age === gestationalAge
  );
}

export default function MeasurementInputIntergrowth({
  label,
  field,
  icon: Icon,
  gender,
  gestationalWeeks,
  gestationalDays,
}: MeasurementInputIntergrowthProps) {
  const type = label.toLowerCase().includes("weight")
    ? "weight"
    : label.toLowerCase().includes("head")
    ? "head"
    : "length";

  let range;
  if (gestationalWeeks && gestationalDays) {
    const dataPoint = getIntergrowthData(
      gender,
      gestationalWeeks,
      gestationalDays,
      type
    );
    if (dataPoint) {
      range = {
        min: dataPoint["3rd"],
        max: dataPoint["97th"],
        normal: dataPoint["50th"],
      };
    }
  }

  const numericValue = Number(field.value || "0");

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
        {field.value && !isNaN(numericValue) && range && (
          <RangeIndicator
            value={numericValue}
            min={range.min}
            max={range.max}
            normal={range.normal}
            isWeight={type === "weight"}
          />
        )}
      </div>
      <FormMessage />
    </FormItem>
  );
}
