"use client";
import React, { useState, useEffect } from "react";
import {
  Check,
  ChevronsUpDown,
  Search,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
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
import { useSubscriptionStore } from "@/stores/premiumStore";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { formSchema } from "@/app/[locale]/(calculators)/calculators/growth-percentiles/GrowthForm";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";

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
  const t = useTranslations("PatientSelector");
  const { toast } = useToast();

  const { selectedPatient: globalSelectedPatient, setPatient } =
    useSubscriptionStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(
    globalSelectedPatient
  );
  const router = useRouter();
  const debouncedSearch = useDebounce(search, 300);
  const { data: patients = [], isLoading } = useSearchPatients(debouncedSearch);

  useEffect(() => {
    if (globalSelectedPatient) {
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
              const selectedPatient = {
                ...patient,
                dateOfBirth: new Date(patient.dateOfBirth),
              };
              setSelected(selectedPatient);
              onPatientSelect(selectedPatient);
              setPatient(selectedPatient);
              form.setValue("dateOfBirth", selectedPatient.dateOfBirth);
              form.setValue("gender", selectedPatient.gender);
              setOpen(false);
              setSearch("");
              toast({
                title: t("toast.patientSelected.title"),
                description: t("toast.patientSelected.description", {
                  name: `${patient.firstName} ${patient.lastName}`,
                }),
              });
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
                {t("patient.born")}:{" "}
                {new Date(patient.dateOfBirth).toLocaleDateString()}
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
          <div className="flex items-center">
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
                  {t("search.placeholder")}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            {globalSelectedPatient && (
              <Button
                variant="destructive"
                size="sm"
                className="ml-2 flex items-center justify-center aspect-square h-[35px]"
                onClick={() => {
                  setPatient(null);
                  setSelected(null);
                  form.setValue("dateOfBirth", undefined);
                  form.setValue("gender", "male");
                  toast({
                    title: t("toast.patientRemoved.title"),
                    description: t("toast.patientRemoved.description"),
                  });
                }}
                aria-label={t("actions.removePatient")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: "var(--radix-popover-trigger-width)" }}
          align="start"
          sticky="always"
        >
          <Command shouldFilter={false} className="w-full">
            <CommandInput
              placeholder={t("search.inputPlaceholder")}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {search.length !== 0 && (
                <CommandEmpty className="py-2 px-4 text-sm">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground text-center">
                        {t("noResults.empty")}
                      </p>
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          router.push("/dashboard/patients/add");
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("actions.addPatient")}
                      </Button>
                    </div>
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
