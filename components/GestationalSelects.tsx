import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GestationalSelectsProps {
  form: any;
}

const GestationalSelects: React.FC<GestationalSelectsProps> = ({ form }) => {
  const weeks = Array.from({ length: 19 }, (_, i) => i + 24);
  const days = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="gestationalWeeks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gestational Age (Weeks)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="border-medical-100">
                    <SelectValue placeholder="Select weeks" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {weeks.map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      {week} weeks
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gestationalDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Days</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="border-medical-100">
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day} {day === 1 ? "day" : "days"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default GestationalSelects;
