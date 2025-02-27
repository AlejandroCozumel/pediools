"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef as ReactTableColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Search,
  Plus,
  MoreHorizontal,
  Calendar,
  ArrowUpDown,
  Calculator,
  AlertTriangle,
  Users,
  Clock,
  Filter,
  LayoutGrid,
  LayoutList,
  ChevronUp,
  ChevronDown,
  PlusCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Define age groups
const AGE_GROUPS = {
  INFANT: { label: "Infant", range: "0-1y" },
  TODDLER: { label: "Toddler", range: "1-3y" },
  PRESCHOOL: { label: "Preschool", range: "3-5y" },
  CHILD: { label: "Child", range: "5-12y" },
  ADOLESCENT: { label: "Adolescent", range: "12-18y" },
  YOUNG_ADULT: { label: "Young Adult", range: "18-21y" },
};

// Enhanced Patient interface with additional fields
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  lastCalculation?: string | null;
  lastVisit?: string | null;
  status: string;
  // Additional fields
  familyId?: string | null;
  familyMembers?: { id: string; name: string }[] | null;
  growthAlert?: boolean;
  followUpAlert?: boolean;
  appointmentStatus?: {
    upcoming: boolean;
    date?: string;
    type?: string;
  } | null;
  calculationMetrics?: {
    type: string;
    percentile?: number;
    status?: "normal" | "monitor" | "concern";
  } | null;
}

type ColumnDef<TData> = ReactTableColumnDef<TData, any> & {
  accessorKey?: string;
  id?: string;
};

// PatientTableSkeleton component for loading state
const PatientTableSkeleton = () => (
  <div className="space-y-4">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-40" />
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-64" />
      </div>
    </div>

    {/* Table Skeleton */}
    <div className="border rounded-md">
      <div className="p-4 space-y-4">
        {/* Table Header */}
        <div className="grid grid-cols-8 gap-4 bg-medical-50 p-2 rounded">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-8" />
            ))}
        </div>

        {/* Table Rows */}
        {Array(6)
          .fill(0)
          .map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid grid-cols-8 gap-4 p-2 border-b"
            >
              {Array(8)
                .fill(0)
                .map((_, colIndex) => (
                  <Skeleton
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="h-8"
                  />
                ))}
            </div>
          ))}
      </div>
    </div>

    {/* Pagination Skeleton */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-48" />
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </div>
);

// PatientCardSkeleton component for cards loading state
const PatientCardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array(6)
      .fill(0)
      .map((_, i) => (
        <Card key={`card-${i}`} className="border">
          <CardHeader className="pb-0">
            <div className="flex justify-between">
              <div className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-full mr-3" />
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <Skeleton className="h-6 w-24" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </CardFooter>
        </Card>
      ))}
  </div>
);

const PatientsDashboard = React.memo(
  ({
    patients,
    isLoading = false,
  }: {
    patients: Patient[];
    isLoading?: boolean;
  }) => {
    const t = useTranslations("Patients.table");
    const typesT = useTranslations("Types");
    const locale = useLocale();
    const router = useRouter();

    // State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
    const [showAlerts, setShowAlerts] = useState(false);
    const [showUpcomingAppointments, setShowUpcomingAppointments] =
      useState(false);
    const [viewMode, setViewMode] = useState<"table" | "cards">("table");
    const [showFAB, setShowFAB] = useState(false);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

    // Age calculation function with age group determination
    const calculateAge = (birthDate: string) => {
      const birth = new Date(birthDate);
      const today = new Date();
      const years = today.getFullYear() - birth.getFullYear();
      const months = today.getMonth() - birth.getMonth();
      if (years === 0) {
        return `${months}m`;
      }
      return `${years}y ${months >= 0 ? months : 12 + months}m`;
    };

    // Function to determine age group
    const getAgeGroup = (birthDate: string): string => {
      const birth = new Date(birthDate);
      const today = new Date();
      const years = today.getFullYear() - birth.getFullYear();
      if (years < 1) return "INFANT";
      if (years >= 1 && years < 3) return "TODDLER";
      if (years >= 3 && years < 5) return "PRESCHOOL";
      if (years >= 5 && years < 12) return "CHILD";
      if (years >= 12 && years < 18) return "ADOLESCENT";
      return "YOUNG_ADULT";
    };

    // Helper to get initials from name
    const getInitials = (firstName: string, lastName: string) => {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    };

    // Apply additional filters
    const filterPatients = useCallback(
      (patients: Patient[]) => {
        let filteredPatients = [...patients];

        // Apply age group filter
        if (selectedAgeGroups.length > 0) {
          filteredPatients = filteredPatients.filter((patient) =>
            selectedAgeGroups.includes(getAgeGroup(patient.dateOfBirth))
          );
        }

        // Apply alert filter
        if (showAlerts) {
          filteredPatients = filteredPatients.filter(
            (patient) => patient.growthAlert || patient.followUpAlert
          );
        }

        // Apply upcoming appointments filter
        if (showUpcomingAppointments) {
          filteredPatients = filteredPatients.filter(
            (patient) => patient.appointmentStatus?.upcoming
          );
        }

        return filteredPatients;
      },
      [selectedAgeGroups, showAlerts, showUpcomingAppointments]
    );

    // Reset filters
    const resetFilters = useCallback(() => {
      setSelectedAgeGroups([]);
      setShowAlerts(false);
      setShowUpcomingAppointments(false);
    }, []);

    // Apply filters and close sheet
    const applyFilters = useCallback(() => {
      setIsFilterSheetOpen(false);
    }, []);

    // Define table columns
    const columns: ColumnDef<Patient>[] = useMemo(
      () => [
        // Age group indicator
        {
          accessorKey: "ageGroup",
          header: t("columns.ageGroup"),
          cell: ({ row }) => {
            const ageGroup = getAgeGroup(row.original.dateOfBirth);
            return (
              <Badge
                variant="outline"
                className={`border-medical-100 text-medical-700 ${
                  ageGroup === "INFANT"
                    ? "bg-blue-50"
                    : ageGroup === "TODDLER"
                    ? "bg-green-50"
                    : ageGroup === "PRESCHOOL"
                    ? "bg-yellow-50"
                    : ageGroup === "CHILD"
                    ? "bg-orange-50"
                    : ageGroup === "ADOLESCENT"
                    ? "bg-purple-50"
                    : "bg-gray-50"
                }`}
              >
                {AGE_GROUPS[ageGroup as keyof typeof AGE_GROUPS].label}
              </Badge>
            );
          },
        },
        {
          accessorKey: "name",
          header: ({ column }) => (
            <Button
              variant="ghost"
              className="p-0 hover:bg-transparent text-medical-700"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              {t("columns.patientName")}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex items-center">
              {/* Alert indicators */}
              {(row.original.growthAlert || row.original.followUpAlert) && (
                <AlertTriangle
                  className={`mr-2 h-4 w-4 ${
                    row.original.growthAlert ? "text-red-500" : "text-amber-500"
                  }`}
                />
              )}
              <span>
                {row.original.firstName} {row.original.lastName}
              </span>
              {/* Family indicator */}
              {row.original.familyId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <Users className="h-3 w-3 text-medical-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Family Members</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {row.original.familyMembers?.map((member) => (
                      <DropdownMenuItem key={member.id}>
                        {member.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ),
        },
        {
          accessorKey: "age",
          header: ({ column }) => (
            <Button
              variant="ghost"
              className="p-0 hover:bg-transparent text-medical-700"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              {t("columns.age")}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) => calculateAge(row.original.dateOfBirth),
        },
        {
          accessorKey: "gender",
          header: t("columns.gender"),
          cell: ({ row }) => (
            <div className="text-medical-600">{row.original.gender}</div>
          ),
        },
        {
          accessorKey: "lastVisit",
          header: ({ column }) => (
            <Button
              variant="ghost"
              className="p-0 hover:bg-transparent text-medical-700"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              {t("columns.lastVisit")}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: ({ row }) =>
            row.original.lastVisit
              ? new Intl.DateTimeFormat(locale, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }).format(new Date(row.original.lastVisit))
              : t("noVisits"),
        },
        {
          accessorKey: "lastCalculation",
          header: t("columns.lastCalculation"),
          cell: ({ row }) => (
            <div className="flex items-center">
              <Badge
                variant="outline"
                className={`border-medical-200 text-medical-700 ${
                  row.original.calculationMetrics?.status === "concern"
                    ? "bg-red-50"
                    : row.original.calculationMetrics?.status === "monitor"
                    ? "bg-amber-50"
                    : "bg-transparent"
                }`}
              >
                {row.original.lastCalculation
                  ? new Intl.DateTimeFormat(locale, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(new Date(row.original.lastCalculation))
                  : t("noCalculation")}
              </Badge>
            </div>
          ),
        },
        // Appointment status column
        {
          accessorKey: "appointmentStatus",
          header: t("columns.appointment"),
          cell: ({ row }) => (
            <div>
              {row.original.appointmentStatus?.upcoming ? (
                <Badge className="bg-green-100 text-green-800 border-0">
                  <Clock className="mr-1 h-3 w-3" />
                  {new Intl.DateTimeFormat(locale, {
                    day: "2-digit",
                    month: "2-digit",
                  }).format(
                    new Date(row.original.appointmentStatus.date as string)
                  )}
                </Badge>
              ) : (
                <span className="text-sm text-medical-400">No upcoming</span>
              )}
            </div>
          ),
        },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
            <Badge
              variant="outline"
              className={
                row.original.status === "Active"
                  ? "border-green-200 text-green-700 bg-green-50"
                  : "border-medical-pink-200 text-medical-pink-700 bg-medical-pink-50"
              }
            >
              {row.original.status}
            </Badge>
          ),
        },
        {
          id: "actions",
          header: t("columns.actions"),
          cell: ({ row }) => {
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t("actions.title")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/patients/${row.original.id}`)
                    }
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {t("actions.viewDetails")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/dashboard/calculations/${row.original.id}`)
                    }
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    {t("actions.viewCalculations")}
                  </DropdownMenuItem>
                  {row.original.familyId && (
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/dashboard/family/${row.original.familyId}`
                        )
                      }
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {t("actions.viewFamily")}
                    </DropdownMenuItem>
                  )}
                  {row.original.appointmentStatus?.upcoming && (
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/dashboard/appointments/${row.original.id}`
                        )
                      }
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {t("actions.viewAppointment")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(
                        `/dashboard/calculations/new?patientId=${row.original.id}`
                      )
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Calculation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        },
      ],
      [locale, router, t, typesT]
    );

    const filteredPatients = useMemo(
      () => filterPatients(patients),
      [patients, filterPatients]
    );
    const table = useReactTable({
      data: filteredPatients,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onGlobalFilterChange: setGlobalFilter,
      state: {
        sorting,
        columnFilters,
        globalFilter,
      },
    });

    // Show/hide FAB on scroll
    useEffect(() => {
      const handleScroll = () => {
        if (window.scrollY > 200) {
          setShowFAB(true);
        } else {
          setShowFAB(false);
        }
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Calculate statistics
    const totalPatients = patients.length;
    const activePatients = patients.filter((p) => p.status === "Active").length;
    const alertPatients = patients.filter(
      (p) => p.growthAlert || p.followUpAlert
    ).length;
    const upcomingAppointments = patients.filter(
      (p) => p.appointmentStatus?.upcoming
    ).length;

    // Show skeleton when loading
    if (isLoading) {
      return (
        <Card className="border-medical-100">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-48" />
              </div>
            </div>

            {/* Key Indicators Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={`stat-${i}`}
                    className="bg-medical-50 p-3 rounded-md"
                  >
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                ))}
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "table" ? (
              <PatientTableSkeleton />
            ) : (
              <PatientCardSkeleton />
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div>
        {/* Floating Action Button for quick actions */}
        {showFAB && (
          <div className="fixed bottom-6 right-6 z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full h-14 w-14 shadow-lg bg-medical-600 hover:bg-medical-700"
                >
                  <PlusCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/calculations/new")}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  New Calculation
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/appointments/new")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/patients/add")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Add New Patient
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Main Content Card */}
        <Card className="border-medical-100">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-heading text-medical-900">
                  {t("title")}
                </CardTitle>
                <CardDescription>{t("subtitle")}</CardDescription>
              </div>
            </div>

            {/* Active Filter Indicators */}
            {(selectedAgeGroups.length > 0 ||
              showAlerts ||
              showUpcomingAppointments) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedAgeGroups.map((group) => (
                  <Badge
                    key={group}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Age: {AGE_GROUPS[group as keyof typeof AGE_GROUPS].label}
                    <button
                      className="ml-1 hover:text-medical-600"
                      onClick={() =>
                        setSelectedAgeGroups(
                          selectedAgeGroups.filter((g) => g !== group)
                        )
                      }
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {showAlerts && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Alerts Only
                    <button
                      className="ml-1 hover:text-medical-600"
                      onClick={() => setShowAlerts(false)}
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {showUpcomingAppointments && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Upcoming Appointments
                    <button
                      className="ml-1 hover:text-medical-600"
                      onClick={() => setShowUpcomingAppointments(false)}
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs h-6 text-medical-600"
                >
                  Clear All
                </Button>
              </div>
            )}

            {/* Key Indicators Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <div className="bg-medical-50 p-3 rounded-md text-center">
                <div className="text-sm font-medium text-medical-600">
                  Total
                </div>
                <div className="text-xl font-bold text-medical-800">
                  {totalPatients}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-md text-center">
                <div className="text-sm font-medium text-green-600">Active</div>
                <div className="text-xl font-bold text-green-800">
                  {activePatients}
                </div>
              </div>
              <div className="bg-amber-50 p-3 rounded-md text-center">
                <div className="text-sm font-medium text-amber-600">Alerts</div>
                <div className="text-xl font-bold text-amber-800">
                  {alertPatients}
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <div className="text-sm font-medium text-blue-600">
                  Appointments
                </div>
                <div className="text-xl font-bold text-blue-800">
                  {upcomingAppointments}
                </div>
              </div>
            </div>

            <div className="flex w-full items-center justify-between pt-4 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <Tabs
                      defaultValue="table"
                      value={viewMode}
                      onValueChange={(value) =>
                        setViewMode(value as "table" | "cards")
                      }
                    >
                      <TabsList className="grid grid-cols-2 h-9 w-[160px]">
                        <TabsTrigger value="table">
                          <LayoutList className="h-4 w-4 mr-2" />
                          Table
                        </TabsTrigger>
                        <TabsTrigger value="cards">
                          <LayoutGrid className="h-4 w-4 mr-2" />
                          Cards
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                {/* Filter Sheet */}
                <Sheet
                  open={isFilterSheetOpen}
                  onOpenChange={setIsFilterSheetOpen}
                >
                  <SheetTrigger asChild>
                    <Button variant="outline" className="border-medical-200">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {(selectedAgeGroups.length > 0 ||
                        showAlerts ||
                        showUpcomingAppointments) && (
                        <Badge className="ml-2 bg-medical-600">
                          {selectedAgeGroups.length +
                            (showAlerts ? 1 : 0) +
                            (showUpcomingAppointments ? 1 : 0)}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Patients</SheetTitle>
                      <SheetDescription>
                        Apply filters to find specific patients
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 py-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Age Group</h4>
                        <div className="space-y-2">
                          {Object.entries(AGE_GROUPS).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`age-group-${key}`}
                                checked={selectedAgeGroups.includes(key)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedAgeGroups([
                                      ...selectedAgeGroups,
                                      key,
                                    ]);
                                  } else {
                                    setSelectedAgeGroups(
                                      selectedAgeGroups.filter(
                                        (group) => group !== key
                                      )
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`age-group-${key}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {value.label} ({value.range})
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Other Filters</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show-alerts"
                              checked={showAlerts}
                              onCheckedChange={(checked) =>
                                setShowAlerts(!!checked)
                              }
                            />
                            <label
                              htmlFor="show-alerts"
                              className="text-sm font-medium leading-none flex items-center peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                              Show Alerts Only
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show-appointments"
                              checked={showUpcomingAppointments}
                              onCheckedChange={(checked) =>
                                setShowUpcomingAppointments(!!checked)
                              }
                            />
                            <label
                              htmlFor="show-appointments"
                              className="text-sm font-medium leading-none flex items-center peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              <Calendar className="h-4 w-4 mr-2 text-medical-500" />
                              Upcoming Appointments
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <SheetFooter className="pt-6">
                      <Button variant="outline" onClick={resetFilters}>
                        Reset Filters
                      </Button>
                      <Button onClick={() => setIsFilterSheetOpen(false)}>
                        Apply Filters
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8 w-[250px] border-medical-200"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="lg:pt-0">
            {filteredPatients.length > 0 ? (
              viewMode === "table" ? (
                // Table View
                <>
                  <div className="rounded-md border border-medical-100">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow
                            key={headerGroup.id}
                            className="bg-medical-50 hover:bg-medical-100"
                          >
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              className={`
                              hover:bg-medical-50
                              ${
                                row.original.growthAlert
                                  ? "bg-red-50 hover:bg-red-100"
                                  : ""
                              }
                              ${
                                !row.original.growthAlert &&
                                row.original.followUpAlert
                                  ? "bg-amber-50 hover:bg-amber-100"
                                  : ""
                              }
                              ${
                                row.original.appointmentStatus?.upcoming &&
                                !row.original.growthAlert &&
                                !row.original.followUpAlert
                                  ? "bg-blue-50 hover:bg-blue-100"
                                  : ""
                              }
                            `}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="h-24 text-center"
                            >
                              No results.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-medical-500">
                      Showing {table.getRowModel().rows.length} of{" "}
                      {patients.length} patients
                      {(selectedAgeGroups.length > 0 ||
                        showAlerts ||
                        showUpcomingAppointments) &&
                        " (filtered)"}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="border-medical-200 text-medical-700"
                      >
                        {t("pagination.previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="border-medical-200 text-medical-700"
                      >
                        {t("pagination.next")}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // Cards View
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map((patient) => {
                      const ageGroup = getAgeGroup(patient.dateOfBirth);
                      const ageText = calculateAge(patient.dateOfBirth);
                      return (
                        <Card
                          key={patient.id}
                          className={`
                          hover:shadow-md transition-shadow cursor-pointer border
                          ${patient.growthAlert ? "border-red-200" : ""}
                          ${
                            !patient.growthAlert && patient.followUpAlert
                              ? "border-amber-200"
                              : ""
                          }
                          ${
                            patient.appointmentStatus?.upcoming &&
                            !patient.growthAlert &&
                            !patient.followUpAlert
                              ? "border-blue-200"
                              : ""
                          }
                        `}
                        >
                          <CardHeader
                            className="lg:pb-0"
                            onClick={() =>
                              router.push(`/dashboard/patients/${patient.id}`)
                            }
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <Avatar
                                  className={`
          h-12 w-12 mr-3
          ${
            ageGroup === "INFANT"
              ? "bg-blue-100"
              : ageGroup === "TODDLER"
              ? "bg-green-100"
              : ageGroup === "PRESCHOOL"
              ? "bg-yellow-100"
              : ageGroup === "CHILD"
              ? "bg-orange-100"
              : ageGroup === "ADOLESCENT"
              ? "bg-purple-100"
              : "bg-gray-100"
          }
        `}
                                >
                                  <AvatarImage src={undefined} />
                                  <AvatarFallback
                                    className={`
          ${
            ageGroup === "INFANT"
              ? "text-blue-700"
              : ageGroup === "TODDLER"
              ? "text-green-700"
              : ageGroup === "PRESCHOOL"
              ? "text-yellow-700"
              : ageGroup === "CHILD"
              ? "text-orange-700"
              : ageGroup === "ADOLESCENT"
              ? "text-purple-700"
              : "text-gray-700"
          }
        `}
                                  >
                                    {getInitials(
                                      patient.firstName,
                                      patient.lastName
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-medium">
                                    {patient.firstName} {patient.lastName}
                                  </h3>
                                  <p className="text-sm text-medical-500">
                                    {ageText}, {patient.gender}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {patient.growthAlert && (
                                  <span
                                    className="mr-2 p-1 rounded-full bg-red-100"
                                    title="Growth alert"
                                  >
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                  </span>
                                )}
                                {!patient.growthAlert &&
                                  patient.followUpAlert && (
                                    <span
                                      className="mr-2 p-1 rounded-full bg-amber-100"
                                      title="Follow-up needed"
                                    >
                                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    </span>
                                  )}
                                {patient.familyId && (
                                  <span
                                    className="p-1 rounded-full bg-medical-100"
                                    title="Family members"
                                  >
                                    <Users className="h-4 w-4 text-medical-600" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="lg:pt-0">
                            {/* Growth percentile visualization */}
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div className="text-sm">
                                <p className="text-medical-500 text-xs">
                                  Last Visit
                                </p>
                                <p className="font-medium">
                                  {patient.lastVisit
                                    ? new Intl.DateTimeFormat(locale, {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      }).format(new Date(patient.lastVisit))
                                    : "None"}
                                </p>
                              </div>
                              <div className="text-sm">
                                <p className="text-medical-500 text-xs">
                                  Status
                                </p>
                                <Badge
                                  variant="outline"
                                  className={
                                    patient.status === "Active"
                                      ? "border-green-200 text-green-700 bg-green-50"
                                      : "border-medical-pink-200 text-medical-pink-700 bg-medical-pink-50"
                                  }
                                >
                                  {patient.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between border-t pt-4">
                            {patient.appointmentStatus?.upcoming ? (
                              <Badge className="bg-green-100 text-green-800 border-0 flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {new Intl.DateTimeFormat(locale, {
                                  day: "2-digit",
                                  month: "2-digit",
                                }).format(
                                  new Date(
                                    patient.appointmentStatus.date as string
                                  )
                                )}
                              </Badge>
                            ) : (
                              <span className="text-sm text-medical-400">
                                No upcoming appt.
                              </span>
                            )}
                            <div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/dashboard/calculations/${patient.id}`
                                  );
                                }}
                                className="h-8 mr-1 text-medical-600"
                              >
                                <Calculator className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/dashboard/appointments/${patient.id}`
                                  );
                                }}
                                className="h-8 text-medical-600"
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="mx-2"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-medical-500 mx-4">
                      Page {table.getState().pagination.pageIndex + 1} of{" "}
                      {table.getPageCount()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="mx-2"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )
            ) : (
              <div className="text-center py-8 text-medical-600">
                {selectedAgeGroups.length > 0 ||
                showAlerts ||
                showUpcomingAppointments
                  ? "No patients match the selected filters."
                  : t("noPatients")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

export default PatientsDashboard;
