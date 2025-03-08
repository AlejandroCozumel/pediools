"use client"
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type DateAvailability = {
  date: Date;
  hasSlots: boolean;
  hasExceptions: boolean;
  isDisabled: boolean;
}

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  availabilityData?: DateAvailability[];
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  availabilityData = [],
  ...props
}: CalendarProps) {
  // Create a map for O(1) lookup of date availability
  const availabilityMap = React.useMemo(() => {
    const map = new Map<string, DateAvailability>();
    availabilityData.forEach(data => {
      map.set(data.date.toDateString(), data);
    });
    return map;
  }, [availabilityData]);

  // Function to add dots to the day cells
  const modifiersClassNames = React.useMemo(() => {
    return {
      has_slots: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-green-500 after:rounded-full",
      has_exceptions: "relative before:absolute before:bottom-1 before:left-1/2 before:-translate-x-1/2 before:w-1 before:h-1 before:bg-red-500 before:rounded-full",
      available: "text-green-600",
      exception: "text-red-500 line-through"
    };
  }, []);

  // Modify the modifiers computation to handle completely blocked days
  const modifiers = React.useMemo(() => {
    const result: Record<string, Date[]> = {
      has_slots: [],
      has_exceptions: [],
      available: [],
      exception: []
    };

    availabilityData.forEach(data => {
      if (data.hasSlots && !data.isDisabled) {
        result.has_slots.push(data.date);
        result.available.push(data.date);
      }

      // Add condition to show exception for both partially and fully blocked days
      if (data.hasExceptions) {
        result.has_exceptions.push(data.date);
        result.exception.push(data.date);
      }
    });

    return result;
  }, [availabilityData]);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <ChevronLeft className="h-4 w-4" {...props} />
        ),
        IconRight: ({ ...props }) => (
          <ChevronRight className="h-4 w-4" {...props} />
        ),
      }}
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      disabled={(date) => {
        const dateInfo = availabilityMap.get(date.toDateString());
        return dateInfo?.isDisabled || false;
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"
export { Calendar }