"use client";
import React, { useEffect, useState, useRef } from "react";
import { Baby, Clock, Calendar as CalendarIcon } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  format,
  addDays,
  isSameDay,
  startOfHour,
  differenceInHours,
} from "date-fns";
import { cn } from "@/lib/utils";

const hours = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

export default function DateInputsWithTime({ form }: { form: any }) {
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [measurementDateOpen, setMeasurementDateOpen] = useState(false);
  const birthHourRef = useRef<HTMLButtonElement>(null);
  const measurementHourRef = useRef<HTMLButtonElement>(null);

  const birthDateTime = form.watch("birthDateTime");
  const measurementDateTime = form.watch("measurementDateTime");

  const handleDateTimeChange = (
    field: any,
    datePart?: Date | null,
    hourPart?: string
  ) => {
    const currentDate = field.value || startOfHour(new Date());

    let newDate = datePart || currentDate;
    if (hourPart && !datePart) {
      newDate = currentDate;
    }

    const newHour = hourPart
      ? parseInt(hourPart.split(":")[0])
      : newDate.getHours();

    const finalDate = new Date(newDate);
    finalDate.setHours(newHour, 0, 0, 0);

    field.onChange(finalDate);
  };

  useEffect(() => {
    if (
      birthDateTime &&
      measurementDateTime &&
      measurementDateTime < birthDateTime
    ) {
      form.setValue("measurementDateTime", null, { shouldValidate: true });
    }
  }, [birthDateTime, measurementDateTime, form]);

  const getValidBirthHours = () => {
    const today = new Date();
    if (!birthDateTime || !isSameDay(birthDateTime, today)) {
      return hours;
    }
    const currentHour = today.getHours();
    return hours.slice(0, currentHour + 1);
  };

  const getValidMeasurementHours = () => {
    if (!birthDateTime || !measurementDateTime) {
      return hours;
    }

    if (!isSameDay(birthDateTime, measurementDateTime)) {
      return hours; // Allow all hours for different days
    }

    // Only filter same-day hours to prevent negative age
    const validHours: string[] = [];
    const birthHour = birthDateTime.getHours();

    hours.forEach((hour) => {
      const hourValue = parseInt(hour.split(":")[0]);
      if (hourValue >= birthHour) { // Only prevent negative age
        validHours.push(hour);
      }
    });

    return validHours;
  };

  const validBirthHours = getValidBirthHours();
  const validMeasurementHours = getValidMeasurementHours();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      {/* Birth Date & Time Card */}
      <Card className="p-4 border-medical-100">
        <FormLabel className="flex items-center gap-2 mb-4 font-semibold text-medical-800">
          <Baby className="w-5 h-5 text-medical-600" /> Birth Details
        </FormLabel>
        <FormField
          control={form.control}
          name="birthDateTime"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <div className="flex gap-2">
                {/* Date Picker */}
                <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        handleDateTimeChange(field, date);
                        setBirthDateOpen(false);
                        setTimeout(() => birthHourRef.current?.click(), 0);
                      }}
                      disabled={(date) =>
                        date > new Date() || date < addDays(new Date(), -14)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Hour Picker */}
                <Select
                  onValueChange={(value) =>
                    handleDateTimeChange(field, undefined, value)
                  }
                  value={field.value ? format(field.value, "HH:00") : undefined}
                >
                  <FormControl>
                    <SelectTrigger ref={birthHourRef} className="w-[120px]">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {validBirthHours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormMessage className="pt-2" />
            </FormItem>
          )}
        />
      </Card>

      {/* Measurement Date & Time Card */}
      <Card className="p-4 border-medical-100">
        <FormLabel className="flex items-center gap-2 mb-4 font-semibold text-medical-800">
          <Clock className="w-5 h-5 text-medical-600" /> Measurement Details
        </FormLabel>
        <FormField
          control={form.control}
          name="measurementDateTime"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <div className="flex gap-2">
                <Popover
                  open={measurementDateOpen}
                  onOpenChange={setMeasurementDateOpen}
                >
                  <PopoverTrigger asChild disabled={!birthDateTime}>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        handleDateTimeChange(field, date);
                        setMeasurementDateOpen(false);
                        setTimeout(
                          () => measurementHourRef.current?.click(),
                          0
                        );
                      }}
                      disabled={(date) => {
                        if (!birthDateTime) return true;

                        const birthDate = startOfHour(birthDateTime);
                        const maxDate = addDays(birthDateTime, 14);

                        return date < birthDate || date > maxDate;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Select
                  onValueChange={(value) =>
                    handleDateTimeChange(field, undefined, value)
                  }
                  value={field.value ? format(field.value, "HH:00") : undefined}
                  disabled={!birthDateTime}
                >
                  <FormControl>
                    <SelectTrigger
                      ref={measurementHourRef}
                      className="w-[120px]"
                    >
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {validMeasurementHours.length > 0 ? (
                      validMeasurementHours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        No valid times available for this date
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <FormMessage className="pt-2" />
            </FormItem>
          )}
        />
      </Card>
    </div>
  );
}
