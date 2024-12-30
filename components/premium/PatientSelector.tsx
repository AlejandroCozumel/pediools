"use client";
import React, { useState } from "react";
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

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
}

interface PatientSelectorProps {
  onPatientSelect: (patient: Patient | null) => void;
}

export default function PatientSelector({
  onPatientSelect,
}: PatientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data: patients = [], isLoading } = useSearchPatients(debouncedSearch);

  const renderPatients = () => {
    if (!Array.isArray(patients) || patients.length === 0) return null;
    return (
      <CommandGroup>
        {patients.map((patient) => (
          <CommandItem
            key={patient.id}
            value={`${patient.firstName} ${patient.lastName}`}
            onSelect={() => {
              setSelected(patient);
              onPatientSelect(patient);
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
            {selected ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {selected.firstName} {selected.lastName}
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
          className="w-[--trigger-width] p-0"
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
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </div>
                ) : search.length > 0 && patients.length === 0 ? (
                  "No patients found."
                ) : (
                  "Type to search patients..."
                )}
              </CommandEmpty>
              {renderPatients()}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
