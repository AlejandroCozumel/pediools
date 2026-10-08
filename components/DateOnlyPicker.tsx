"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { enUS, es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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

// Calendar widgets use local Date objects; persisted values are date-only strings.
function localDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function dateValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function DateOnlyPicker({
  id,
  label,
  value,
  onChange,
  min = "1900-01-01",
  max = "2100-12-31",
  invalid = false,
  describedBy,
  required = false,
  buttonRef,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  invalid?: boolean;
  describedBy?: string;
  required?: boolean;
  buttonRef?: React.Ref<HTMLButtonElement>;
  onBlur?: () => void;
}) {
  const locale = useLocale(),
    spanish = locale === "es";
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() =>
    value ? localDate(value) : new Date(),
  );
  const selected = value ? localDate(value) : undefined;
  const display = selected
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(selected)
    : spanish
      ? "Seleccione una fecha"
      : "Select a date";
  const firstYear = Number(min.slice(0, 4)),
    lastYear = Number(max.slice(0, 4));
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          const candidate = selected ?? new Date();
          setMonth(
            candidate < localDate(min)
              ? localDate(min)
              : candidate > localDate(max)
                ? localDate(max)
                : candidate,
          );
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          ref={buttonRef}
          onBlur={onBlur}
          type="button"
          variant="outline"
          aria-label={`${label}: ${display}${required ? (spanish ? ", obligatorio" : ", required") : ""}`}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={`h-10 w-full min-w-0 justify-between border bg-white px-3 text-left font-normal shadow-sm ${invalid ? "border-red-500 focus-visible:ring-red-500" : "border-input"}`}
        >
          <span
            className={`truncate ${!selected ? "text-muted-foreground" : ""}`}
          >
            {display}
          </span>
          <CalendarIcon aria-hidden="true" className="shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] max-w-[calc(100vw-24px)] p-0"
        align="start"
        collisionPadding={12}
      >
        <div className="grid grid-cols-[1fr_96px] gap-2 px-3 pt-3">
          <Select
            value={String(month.getMonth())}
            onValueChange={(value) => {
              if (value !== "")
                setMonth(new Date(month.getFullYear(), Number(value), 1));
            }}
          >
            <SelectTrigger
              aria-label={spanish ? "Mes" : "Month"}
              className="h-9 capitalize"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, index) => (
                <SelectItem
                  key={index}
                  value={String(index)}
                  className="capitalize"
                >
                  {new Intl.DateTimeFormat(locale, { month: "long" }).format(
                    new Date(2026, index, 1),
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(month.getFullYear())}
            onValueChange={(value) => {
              if (value) setMonth(new Date(Number(value), month.getMonth(), 1));
            }}
          >
            <SelectTrigger
              aria-label={spanish ? "Año" : "Year"}
              className="h-9"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from(
                { length: lastYear - firstYear + 1 },
                (_, index) => firstYear + index,
              )
                .reverse()
                .map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          locale={spanish ? es : enUS}
          fromDate={localDate(min)}
          toDate={localDate(max)}
          disabled={(date) => dateValue(date) < min || dateValue(date) > max}
          onSelect={(date) => {
            if (date) {
              onChange(dateValue(date));
              setOpen(false);
            }
          }}
          labels={{
            labelPrevious: () => (spanish ? "Mes anterior" : "Previous month"),
            labelNext: () => (spanish ? "Mes siguiente" : "Next month"),
          }}
          classNames={{
            caption_label: "sr-only",
            caption: "flex justify-center relative h-7 items-center",
            month: "space-y-2 w-full",
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
