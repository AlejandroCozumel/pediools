"use client";
import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSearchPatients } from "@/hooks/useSearchPatients";
import { useDebounce } from "@/hooks/useDebounce";
import { usePremiumStore } from "@/stores/premiumStore";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { formSchema } from "@/app/(calculators)/growth-percentiles/GrowthForm";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  gender: "male" | "female";
}

interface PatientSelectorProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  onPatientSelect?: (patient: Patient | null) => void;
}

export default function PatientSelector({
  form,
  onPatientSelect = () => {},
}: PatientSelectorProps) {
  const { selectedPatient: globalSelectedPatient, setPatient } =
    usePremiumStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(
    globalSelectedPatient
  );

  const debouncedSearch = useDebounce(search, 300);
  const { data: patients = [], isLoading } = useSearchPatients(debouncedSearch);

  useEffect(() => {
    if (globalSelectedPatient) {
      // Update form values when global patient changes
      form.setValue("dateOfBirth", new Date(globalSelectedPatient.dateOfBirth));
      form.setValue("gender", globalSelectedPatient.gender);
    }
  }, [globalSelectedPatient, form]);

  const renderPatients = () => {
    if (!Array.isArray(patients) || patients.length === 0) return null;
    return (
      <CommandGroup>
        {patients.map((patient) => (
          <CommandItem
            key={patient.id}
            value={`${patient.firstName} ${patient.lastName}`}
            onSelect={() => {
              // Convert patient to local state
              const selectedPatient = {
                ...patient,
                dateOfBirth: new Date(patient.dateOfBirth),
              };

              setSelected(selectedPatient);
              onPatientSelect(selectedPatient);

              // Update global state
              setPatient(selectedPatient);

              // Update form values
              form.setValue("dateOfBirth", selectedPatient.dateOfBirth);
              form.setValue("gender", selectedPatient.gender);

              setOpen(false);
              setSearch("");
            }}
            className="flex items-center gap-2 p-2"
          >
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {patient.firstName} {patient.lastName}
                </span>
                <Check
                  className={cn(
                    "h-4 w-4 text-green-500",
                    selected?.id === patient.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                Born: {new Date(patient.dateOfBirth).toLocaleDateString()}
              </span>
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white hover:bg-gray-50/50"
          >
            {globalSelectedPatient ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {globalSelectedPatient.firstName}{" "}
                {globalSelectedPatient.lastName}
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search patients...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: "var(--radix-popover-trigger-width)" }}
          align="start"
          sticky="always"
        >
          <Command shouldFilter={false} className="w-full">
            <CommandInput
              placeholder="Type patient name..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {search.length !== 0 && (
                <CommandEmpty className="py-2 px-4 text-sm">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    patients.length === 0 && "No patients found."
                  )}
                </CommandEmpty>
              )}

              {renderPatients()}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
