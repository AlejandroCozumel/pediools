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
import { format, addDays, isSameDay, startOfHour } from "date-fns";
import { cn } from "@/lib/utils";

// Generate an array of hours for the dropdown
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

  // This function intelligently combines the date and hour into a single Date object
  const handleDateTimeChange = (
    field: any,
    datePart?: Date | null,
    hourPart?: string
  ) => {
    const currentDate = field.value || startOfHour(new Date());

    let newDate = datePart || currentDate;
    // If only the hour is changed, don't change the date part
    if (hourPart && !datePart) {
      newDate = currentDate;
    }

    const newHour = hourPart
      ? parseInt(hourPart.split(":")[0])
      : newDate.getHours();

    const finalDate = new Date(newDate);
    finalDate.setHours(newHour, 0, 0, 0); // Set minutes and seconds to 0

    field.onChange(finalDate);
  };

  // This effect resets the measurement date if the birth date makes it invalid
  useEffect(() => {
    if (
      birthDateTime &&
      measurementDateTime &&
      measurementDateTime < birthDateTime
    ) {
      form.setValue("measurementDateTime", null, { shouldValidate: true });
    }
  }, [birthDateTime, measurementDateTime, form]);

  // Dynamically generate the list of valid hours for the BIRTH time
  const getValidBirthHours = () => {
    const today = new Date();
    if (!birthDateTime || !isSameDay(birthDateTime, today)) {
      return hours; // All hours are valid if the date is not today
    }
    const currentHour = today.getHours();
    return hours.slice(0, currentHour + 1); // Only allow hours up to and including the current hour
  };

  // Dynamically generate the list of valid hours for the MEASUREMENT time
  const getValidMeasurementHours = () => {
    if (
      !birthDateTime ||
      !measurementDateTime ||
      !isSameDay(birthDateTime, measurementDateTime)
    ) {
      return hours; // All hours are valid if dates are different
    }
    const birthHour = birthDateTime.getHours();
    // Only allow hours from the birth hour onwards
    return hours.slice(birthHour);
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
                        setBirthDateOpen(false); // Close the popover
                        setTimeout(() => birthHourRef.current?.click(), 0); // Focus and open the select
                      }}
                      disabled={(date) =>
                        date > new Date() || date < addDays(new Date(), -14)
                      } // Disable future dates and dates more than 2 weeks ago
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
                {/* Date Picker */}
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
                        setMeasurementDateOpen(false); // Close the popover
                        setTimeout(
                          () => measurementHourRef.current?.click(),
                          0
                        ); // Focus and open the select
                      }}
                      disabled={
                        (date) =>
                          !birthDateTime ||
                          date < startOfHour(birthDateTime) ||
                          date > addDays(birthDateTime, 14) // Limit to 14 days after birth
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
                    {validMeasurementHours.map((hour) => (
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
    </div>
  );
}
