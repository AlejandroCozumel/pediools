import React, { useState, useEffect } from "react";
import { format, isAfter, differenceInMonths } from "date-fns";
import { CalendarIcon, Info } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";
import { useTranslations } from "next-intl";

interface DateInputsProps {
  form: any;
  gender: "male" | "female";
  hasSelectedPatient?: boolean;
}

const DateInputs: React.FC<DateInputsProps> = ({
  form,
  gender,
  hasSelectedPatient = false,
}) => {
  const t = useTranslations("GrowthForm.dateInputs");

  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [measurementDateOpen, setMeasurementDateOpen] = useState(false);
  const [ageDisplay, setAgeDisplay] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");

  const birthDate = form.watch("dateOfBirth");
  const measurementDate = form.watch("dateOfMeasurement");

  useEffect(() => {
    if (birthDate && measurementDate) {
      const ageInMonths = differenceInMonths(measurementDate, birthDate);
      if (ageInMonths > 240) {
        // 20 years * 12 months
        setDateError(t("errors.maxAgeExceeded")); // Add this translation
        setAgeDisplay("");
        form.setError("dateOfMeasurement", {
          type: "manual",
          message: t("errors.maxAgeExceeded"),
        });
        return;
      }
      if (isAfter(birthDate, measurementDate)) {
        setDateError(t("errors.measurementBeforeBirth"));
        setAgeDisplay("");
        form.setError("dateOfMeasurement", {
          type: "manual",
          message: t("errors.measurementAfterBirth"),
        });
      } else {
        setDateError("");
        form.clearErrors("dateOfMeasurement");

        const yearDifference =
          measurementDate.getFullYear() - birthDate.getFullYear();
        const monthDifference =
          measurementDate.getMonth() - birthDate.getMonth();
        const dayDifference = measurementDate.getDate() - birthDate.getDate();

        let years = yearDifference;
        let remainingMonths = monthDifference;

        if (
          monthDifference < 0 ||
          (monthDifference === 0 && dayDifference < 0)
        ) {
          years--;
          remainingMonths = 12 + monthDifference;
        }

        const adjustedBirthDate = new Date(
          birthDate.getFullYear() + years,
          birthDate.getMonth() + remainingMonths,
          birthDate.getDate()
        );
        const remainingDays = differenceInDays(
          measurementDate,
          adjustedBirthDate
        );

        const displayParts = [];

        if (years > 0) {
          displayParts.push(
            `${years} ${
              years > 1 ? t("ageDisplay.years") : t("ageDisplay.year")
            }`
          );
        }

        if (remainingMonths > 0) {
          displayParts.push(
            `${remainingMonths} ${
              remainingMonths > 1
                ? t("ageDisplay.months")
                : t("ageDisplay.month")
            }`
          );
        }

        if (remainingDays > 0) {
          displayParts.push(
            `${remainingDays} ${
              remainingDays > 1 ? t("ageDisplay.days") : t("ageDisplay.day")
            }`
          );
        }

        const finalDisplay =
          displayParts.join(", ") || t("ageDisplay.zeroDays");
        setAgeDisplay(finalDisplay);
      }
    } else {
      setAgeDisplay("");
    }
  }, [birthDate, measurementDate, t]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  const twentyYearsAgo = new Date();
  twentyYearsAgo.setFullYear(currentYear - 20);

  const handleYearSelect = (fieldName: string, year: string) => {
    const currentDate = form.getValues(fieldName) || new Date();
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(year));
    form.setValue(fieldName, newDate);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date of Birth Field */}
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("labels.dateOfBirth")}</FormLabel>
              <div
                className={cn("flex gap-2", hasSelectedPatient && "opacity-50")}
              >
                <Select
                  onValueChange={(year) =>
                    handleYearSelect("dateOfBirth", year)
                  }
                  value={
                    field.value ? field.value.getFullYear().toString() : ""
                  }
                  disabled={hasSelectedPatient}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder={t("placeholders.year")} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full border-medical-100 pl-3 text-left font-normal"
                        disabled={hasSelectedPatient}
                      >
                        {field.value ? (
                          format(field.value, "MMM d, yyyy")
                        ) : (
                          <span>{t("placeholders.pickDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setBirthDateOpen(false);
                      }}
                      disabled={(date) =>
                        date > new Date() ||
                        date < twentyYearsAgo || // Add this line
                        date < new Date("1900-01-01")
                      }
                      defaultMonth={field.value || new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date of Measurement Field */}
        <FormField
          control={form.control}
          name="dateOfMeasurement"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("labels.dateOfMeasurement")}</FormLabel>
              <div className="flex gap-2">
                <Select
                  onValueChange={(year) =>
                    handleYearSelect("dateOfMeasurement", year)
                  }
                  value={
                    field.value ? field.value.getFullYear().toString() : ""
                  }
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder={t("placeholders.year")} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover
                  open={measurementDateOpen}
                  onOpenChange={setMeasurementDateOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full border-medical-100 pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "MMM d, yyyy")
                        ) : (
                          <span>{t("placeholders.pickDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setMeasurementDateOpen(false);
                      }}
                      disabled={
                        (date) =>
                          date > new Date() ||
                          (birthDate &&
                            differenceInMonths(date, birthDate) > 240) // Add this line (240 months = 20 years)
                      }
                      defaultMonth={field.value || new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Age Display and Error Messages */}
      {(ageDisplay || dateError) && (
        <div className="space-y-2">
          {dateError && (
            <Alert
              variant="destructive"
              className="bg-red-50 text-red-600 border-red-200"
            >
              <AlertDescription className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                {dateError}
              </AlertDescription>
            </Alert>
          )}
          {ageDisplay && (
            <Alert
              className={cn(
                "border transition-colors duration-300",
                gender === "male"
                  ? "bg-medical-50 border-medical-200"
                  : "bg-medical-pink-50 border-medical-pink-200"
              )}
            >
              <AlertDescription className="flex items-center gap-2">
                <Info
                  className={cn(
                    "h-4 w-4 transition-colors duration-300",
                    gender === "male"
                      ? "text-medical-500"
                      : "text-medical-pink-500"
                  )}
                />
                {t("ageDisplay.patientAge")}:
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 transition-colors duration-300",
                    gender === "male"
                      ? "text-medical-700 bg-medical-100"
                      : "text-medical-pink-700 bg-medical-pink-100"
                  )}
                >
                  {ageDisplay}
                </Badge>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default DateInputs;
