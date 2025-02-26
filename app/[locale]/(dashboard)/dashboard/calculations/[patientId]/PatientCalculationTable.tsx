"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import DashboardTitle from "@/components/DashboardTitle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from "@tanstack/react-table";
import { useDebounce } from "@/hooks/useDebounce";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  MoreHorizontal,
  Calculator,
  ArrowUpDown,
  Filter,
  LayoutGrid,
  LayoutList,
  AlertTriangle,
  LineChart,
  Trash,
  Send,
  FileText,
  NotebookPen,
  ChevronDown,
  Check,
  Loader2,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { DeleteModal } from "@/components/DeleteModal";
import SendEmailReportDialog from "@/components/SendEmailReportDialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorMessage from "@/components/Error";

// Define Calculation type
interface Calculation {
  id: string;
  type: string;
  date: string;
  notes?: string;
  results: {
    calculationType: string;
    weight?: {
      value: number;
      percentiles?: {
        calculatedPercentile: number;
        zScore: number;
      };
    };
    height?: {
      value: number;
      percentiles?: {
        calculatedPercentile: number;
        zScore: number;
      };
    };
  };
  patientId: string;
  charts?: {
    pdfUrl?: string;
  }[];
  patient: {
    firstName: string;
    lastName: string;
    gender: "male" | "female";
    dateOfBirth: string;
    email: string | null | undefined;
    guardianEmail: string | null | undefined;
  };
  trends?: {
    weight: string | null;
    height: string | null;
  };
}

// Define pagination type
interface PaginationInfo {
  totalCalculations: number;
  totalPages: number;
  currentPage: number;
  calculationsPerPage: number;
}

// Define mutation types
interface DeleteCalculationMutation {
  mutate: (variables: { patientId: string; calculationId: string }) => void;
}

interface BatchDeleteCalculationsMutation {
  mutate: (variables: { patientId: string; calculationIds: string[] }) => void;
}

interface UpdateCalculationNotesMutation {
  mutate: (variables: {
    patientId: string;
    calculationId: string;
    notes: string;
  }) => void;
}

// Skeleton loaders
const CalculationTableSkeleton = () => (
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

const CalculationCardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array(6)
      .fill(0)
      .map((_, i) => (
        <Card key={`card-${i}`} className="border">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-medical-50 rounded-md">
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
              <div className="p-2 bg-medical-50 rounded-md">
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>
            <Skeleton className="h-16 w-full mt-3" />
          </CardContent>
          <CardFooter className="border-t pt-3 flex justify-between">
            <Skeleton className="h-5 w-24" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20" />
            </div>
          </CardFooter>
        </Card>
      ))}
  </div>
);

const PatientCalculationTable = () => {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const { toast } = useToast();
  const t = useTranslations("Calculations");

  // State for view mode and UI controls
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [showAlerts, setShowAlerts] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [alertsData, setAlertsData] = useState<any[]>([]);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter state
  const [selectedType, setSelectedType] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    startDate: undefined,
    endDate: undefined,
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    open: boolean;
    calculationId: string | null;
  }>({ open: false, calculationId: null });
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
  const [emailReportDialogOpen, setEmailReportDialogOpen] = useState(false);
  const [selectedCalculations, setSelectedCalculations] = useState<
    Calculation[]
  >([]);
  const [notesDialogState, setNotesDialogState] = useState<{
    open: boolean;
    calculationId: string | null;
    notes: string;
  }>({ open: false, calculationId: null, notes: "" });
  const [actionInProgress, setActionInProgress] = useState(false);

  // Effect to handle search term debounce
  useEffect(() => {
    setGlobalFilter(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Effect to fetch data - simulating your use-calculations hook
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // This would be replaced by your actual API call
        const response = await fetch(
          `/api/dashboard/calculations/${patientId}?page=${currentPage}&limit=${limit}${
            selectedType ? `&type=${selectedType}` : ""
          }${
            dateRange.startDate
              ? `&startDate=${format(dateRange.startDate, "yyyy-MM-dd")}`
              : ""
          }${
            dateRange.endDate
              ? `&endDate=${format(dateRange.endDate, "yyyy-MM-dd")}`
              : ""
          }&includeCharts=true`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch calculations");
        }

        const data = await response.json();

        // Combine all calculation types into a single array for our purposes
        let allCalculations: Calculation[] = [];
        if (data.calculations) {
          Object.values(data.calculations).forEach((typeCalcs: any) => {
            allCalculations = [...allCalculations, ...typeCalcs];
          });
        }

        setCalculations(allCalculations);
        setPagination(data.pagination);

        // Generate alerts data from calculations
        generateAlertsData(allCalculations);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        console.error("Error fetching calculations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    patientId,
    currentPage,
    limit,
    selectedType,
    dateRange.startDate,
    dateRange.endDate,
  ]);

  // Generate alerts from calculations
  const generateAlertsData = (calcs: Calculation[]) => {
    const alerts = [];

    for (const calc of calcs) {
      // Check weight percentile
      if (calc.results?.weight?.percentiles?.calculatedPercentile) {
        const percentile = calc.results.weight.percentiles.calculatedPercentile;
        if (percentile < 3 || percentile > 97) {
          alerts.push({
            id: `weight-${calc.id}`,
            type: "critical",
            message: `Weight percentile (${percentile.toFixed(
              1
            )}) is outside normal range`,
            date: calc.date,
            calculationId: calc.id,
          });
        } else if (percentile < 10 || percentile > 90) {
          alerts.push({
            id: `weight-${calc.id}`,
            type: "warning",
            message: `Weight percentile (${percentile.toFixed(
              1
            )}) requires monitoring`,
            date: calc.date,
            calculationId: calc.id,
          });
        }
      }

      // Check height percentile
      if (calc.results?.height?.percentiles?.calculatedPercentile) {
        const percentile = calc.results.height.percentiles.calculatedPercentile;
        if (percentile < 3 || percentile > 97) {
          alerts.push({
            id: `height-${calc.id}`,
            type: "critical",
            message: `Height percentile (${percentile.toFixed(
              1
            )}) is outside normal range`,
            date: calc.date,
            calculationId: calc.id,
          });
        } else if (percentile < 10 || percentile > 90) {
          alerts.push({
            id: `height-${calc.id}`,
            type: "warning",
            message: `Height percentile (${percentile.toFixed(
              1
            )}) requires monitoring`,
            date: calc.date,
            calculationId: calc.id,
          });
        }
      }
    }

    setAlertsData(alerts);
  };

  // Mock mutation functions
  const deleteCalculation = {
    mutate: ({
      patientId,
      calculationId,
    }: {
      patientId: string;
      calculationId: string;
    }) => {
      setActionInProgress(true);

      // Simulate API call
      setTimeout(() => {
        // Remove the calculation from state
        setCalculations((prev) =>
          prev.filter((calc) => calc.id !== calculationId)
        );

        toast({
          title: "Calculation Deleted",
          description: "The calculation has been successfully removed.",
        });

        setActionInProgress(false);
        setDeleteModalState({ open: false, calculationId: null });
      }, 1000);
    },
  };

  const batchDeleteCalculations = {
    mutate: ({
      patientId,
      calculationIds,
    }: {
      patientId: string;
      calculationIds: string[];
    }) => {
      setActionInProgress(true);

      // Simulate API call
      setTimeout(() => {
        // Remove the calculations from state
        setCalculations((prev) =>
          prev.filter((calc) => !calculationIds.includes(calc.id))
        );

        toast({
          title: `${calculationIds.length} Calculations Deleted`,
          description:
            "The selected calculations have been successfully removed.",
        });

        setActionInProgress(false);
        setBatchDeleteModalOpen(false);
        setRowSelection({});
      }, 1000);
    },
  };

  const updateCalculationNotes = {
    mutate: ({
      patientId,
      calculationId,
      notes,
    }: {
      patientId: string;
      calculationId: string;
      notes: string;
    }) => {
      setActionInProgress(true);

      // Simulate API call
      setTimeout(() => {
        // Update the calculation notes in state
        setCalculations((prev) =>
          prev.map((calc) =>
            calc.id === calculationId ? { ...calc, notes } : calc
          )
        );

        toast({
          title: "Notes Updated",
          description: "The calculation notes have been successfully saved.",
        });

        setActionInProgress(false);
        setNotesDialogState({ open: false, calculationId: null, notes: "" });
      }, 1000);
    },
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedType(undefined);
    setDateRange({ startDate: undefined, endDate: undefined });
    setCurrentPage(1);
    setGlobalFilter("");
    setSearchTerm("");
  };

  // Handle single item deletion
  const handleDeleteConfirm = () => {
    if (deleteModalState.calculationId) {
      deleteCalculation.mutate({
        patientId,
        calculationId: deleteModalState.calculationId,
      });
    }
  };

  // Handle batch deletion
  const handleBatchDeleteConfirm = () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length > 0) {
      batchDeleteCalculations.mutate({
        patientId,
        calculationIds: selectedIds,
      });
    }
  };

  // Handle notes save
  const handleSaveNotes = () => {
    if (notesDialogState.calculationId) {
      updateCalculationNotes.mutate({
        patientId,
        calculationId: notesDialogState.calculationId,
        notes: notesDialogState.notes,
      });
    }
  };

  // Handle email reports for multiple calculations
  const handleSendMultipleReports = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast({
        title: "No calculations selected",
        description: "Please select at least one calculation to email.",
        variant: "destructive",
      });
      return;
    }

    const selectedCalcs = selectedRows.map((row) => row.original);
    const hasPdfs = selectedCalcs.every(
      (calc) => calc.charts && calc.charts.some((chart) => chart.pdfUrl)
    );

    if (!hasPdfs) {
      toast({
        title: "Missing PDF reports",
        description:
          "One or more selected calculations don't have PDFs. Please generate charts first.",
        variant: "destructive",
      });
      return;
    }

    setSelectedCalculations(selectedCalcs);
    setEmailReportDialogOpen(true);
  };

  // Define table columns
  const columns: ColumnDef<Calculation>[] = [
    // Selection checkbox
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Calculation type
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent text-medical-700"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Calculation Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="border-medical-200 text-medical-700"
        >
          {row.original.type}
        </Badge>
      ),
    },
    // Calculation standard
    {
      header: "Standard",
      accessorFn: (row) => row.results?.calculationType ?? "N/A",
      cell: ({ getValue }) => (
        <Badge
          variant="outline"
          className="border-medical-200 text-medical-700"
        >
          {String(getValue())}
        </Badge>
      ),
    },
    // Date
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent text-medical-700"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
    },
    // Height with trend
    {
      id: "height",
      header: "Height",
      accessorFn: (row) => row.results?.height?.value ?? "N/A",
      cell: ({ row, getValue }) => {
        const value = getValue();
        const trend = row.original.trends?.height;
        return (
          <div className="flex items-center">
            <span>
              {typeof value === "number" ? `${value} cm` : String(value)}
            </span>
            {trend && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`ml-2 text-xs ${
                        trend.startsWith("↑")
                          ? "text-green-600 bg-green-50"
                          : trend.startsWith("↓")
                          ? "text-red-600 bg-red-50"
                          : ""
                      }`}
                    >
                      {trend}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Change since previous measurement</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    // Weight with trend
    {
      id: "weight",
      header: "Weight",
      accessorFn: (row) => row.results?.weight?.value ?? "N/A",
      cell: ({ row, getValue }) => {
        const value = getValue();
        const trend = row.original.trends?.weight;
        return (
          <div className="flex items-center">
            <span>
              {typeof value === "number" ? `${value} kg` : String(value)}
            </span>
            {trend && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`ml-2 text-xs ${
                        trend.startsWith("↑")
                          ? "text-green-600 bg-green-50"
                          : trend.startsWith("↓")
                          ? "text-red-600 bg-red-50"
                          : ""
                      }`}
                    >
                      {trend}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Change since previous measurement</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    // Height percentile
    {
      header: "Height Percentile",
      accessorFn: (row) =>
        row.results?.height?.percentiles?.calculatedPercentile ?? "N/A",
      cell: ({ getValue }) => {
        const value = getValue();
        const numberValue = typeof value === "number" ? value : null;
        return (
          <div className="flex items-center">
            <span className="mr-2">
              {numberValue !== null
                ? `${numberValue.toFixed(1)}P`
                : String(value)}
            </span>
            {numberValue !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-16 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          numberValue < 3 || numberValue > 97
                            ? "bg-red-500"
                            : numberValue < 10 || numberValue > 90
                            ? "bg-amber-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(100, numberValue)}%` }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {numberValue < 3 || numberValue > 97
                        ? "Requires attention"
                        : numberValue < 10 || numberValue > 90
                        ? "Monitor closely"
                        : "Normal range"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    // Weight percentile
    {
      header: "Weight Percentile",
      accessorFn: (row) =>
        row.results?.weight?.percentiles?.calculatedPercentile ?? "N/A",
      cell: ({ getValue }) => {
        const value = getValue();
        const numberValue = typeof value === "number" ? value : null;
        return (
          <div className="flex items-center">
            <span className="mr-2">
              {numberValue !== null
                ? `${numberValue.toFixed(1)}P`
                : String(value)}
            </span>
            {numberValue !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-16 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          numberValue < 3 || numberValue > 97
                            ? "bg-red-500"
                            : numberValue < 10 || numberValue > 90
                            ? "bg-amber-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(100, numberValue)}%` }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {numberValue < 3 || numberValue > 97
                        ? "Requires attention"
                        : numberValue < 10 || numberValue > 90
                        ? "Monitor closely"
                        : "Normal range"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    // Notes indicator
    {
      id: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const hasNotes = !!row.original.notes && row.original.notes.length > 0;
        return (
          <div className="flex justify-center">
            {hasNotes ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        setNotesDialogState({
                          open: true,
                          calculationId: row.original.id,
                          notes: row.original.notes || "",
                        })
                      }
                    >
                      <NotebookPen className="h-4 w-4 text-medical-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View/Edit Notes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-medical-100"
                      onClick={() =>
                        setNotesDialogState({
                          open: true,
                          calculationId: row.original.id,
                          notes: "",
                        })
                      }
                    >
                      <NotebookPen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Notes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    // Actions column
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* View Chart */}
            <DropdownMenuItem
              onClick={() => {
                router.push(`/dashboard/calculations/${row.original.id}`);
              }}
            >
              <LineChart className="mr-2 h-4 w-4" />
              View Chart
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Email Report */}
            <DropdownMenuItem
              // Continuing from where the file left off...

              onClick={() => {
                const pdfUrl = row.original.charts?.[0]?.pdfUrl;
                if (pdfUrl) {
                  setSelectedCalculations([row.original]);
                  setEmailReportDialogOpen(true);
                } else {
                  toast({
                    title: "There is no PDF created for this calculation.",
                    description: "Go to 'View Chart' and generate a preview",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Email Report
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Download Report */}
            <DropdownMenuItem
              onClick={() => {
                const pdfUrl = row.original.charts?.[0]?.pdfUrl;
                if (pdfUrl) {
                  const link = document.createElement("a");
                  link.href = pdfUrl;
                  link.download = `calculation_report_${row.original.id}.pdf`;
                  link.target = "_blank";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else {
                  toast({
                    title: "There is no PDF created for this calculation.",
                    description: "Go to 'View Chart' and generate a preview",
                    variant: "destructive",
                  });
                }
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download Report
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Delete Calculation */}
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setDeleteModalState({
                  open: true,
                  calculationId: row.original.id,
                });
              }}
              className="text-red-500 focus:bg-red-500 focus:text-white"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Calculation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Set up the table
  const table = useReactTable({
    data: calculations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
  });

  // Show error if any
  if (error) {
    return <ErrorMessage message={error?.message} />;
  }

  return (
    <div className="my-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <DashboardTitle
          title="Patient Calculations"
          subtitle="View and manage calculations for this patient"
        />
        <div className="flex flex-wrap gap-2">
          {/* New Calculation Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-medical-600 hover:bg-medical-700">
                <Plus className="mr-2 h-4 w-4" />
                New Calculation
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/dashboard/calculations/new?patientId=${patientId}`
                  )
                }
              >
                <Calculator className="mr-2 h-4 w-4" />
                Growth Percentile
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Calendar className="mr-2 h-4 w-4" />
                Blood Pressure (Coming Soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(selectedType || dateRange.startDate || dateRange.endDate) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Type: {selectedType.replace(/_/g, " ")}
              <button
                className="ml-1 hover:text-medical-600"
                onClick={() => setSelectedType(undefined)}
              >
                ×
              </button>
            </Badge>
          )}
          {dateRange.startDate && (
            <Badge variant="secondary" className="flex items-center gap-1">
              From: {format(dateRange.startDate, "MMM dd, yyyy")}
              <button
                className="ml-1 hover:text-medical-600"
                onClick={() =>
                  setDateRange((prev) => ({ ...prev, startDate: undefined }))
                }
              >
                ×
              </button>
            </Badge>
          )}
          {dateRange.endDate && (
            <Badge variant="secondary" className="flex items-center gap-1">
              To: {format(dateRange.endDate, "MMM dd, yyyy")}
              <button
                className="ml-1 hover:text-medical-600"
                onClick={() =>
                  setDateRange((prev) => ({ ...prev, endDate: undefined }))
                }
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

      {/* Alerts Section */}
      {showAlerts && alertsData.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 mb-6">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-heading text-amber-800 flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                Growth Alerts
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlerts(false)}
                className="h-8 text-amber-700"
              >
                Dismiss
              </Button>
            </div>
            <CardDescription className="text-amber-700">
              {alertsData.length} alert{alertsData.length !== 1 ? "s" : ""}{" "}
              requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 lg:pt-0">
            <div className="space-y-3">
              {alertsData.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    alert.type === "critical"
                      ? "bg-red-100 border border-red-200"
                      : "bg-amber-100 border border-amber-200"
                  }`}
                >
                  <div className="flex items-center">
                    <AlertTriangle
                      className={`h-4 w-4 mr-3 ${
                        alert.type === "critical"
                          ? "text-red-500"
                          : "text-amber-500"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          alert.type === "critical"
                            ? "text-red-800"
                            : "text-amber-800"
                        }`}
                      >
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(alert.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/dashboard/calculations/${alert.calculationId}`
                      )
                    }
                    className={`text-xs ${
                      alert.type === "critical"
                        ? "text-red-600 hover:text-red-700"
                        : "text-amber-600 hover:text-amber-700"
                    }`}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="border-medical-100">
        <CardHeader className="p-4 lg:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-heading text-medical-900">
                Patient Calculations
              </CardTitle>
              <CardDescription>
                View and manage this patient's growth assessments
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* View toggle */}
              <div className="flex items-center space-x-2">
                <Tabs
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

              {/* Filters Button */}
              <Sheet
                open={isFilterSheetOpen}
                onOpenChange={setIsFilterSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-medical-200 flex gap-2 items-center"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {(selectedType ||
                      dateRange.startDate ||
                      dateRange.endDate) && (
                      <Badge variant="secondary" className="ml-1">
                        {[
                          selectedType ? 1 : 0,
                          dateRange.startDate ? 1 : 0,
                          dateRange.endDate ? 1 : 0,
                        ].reduce((a, b) => a + b, 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Calculations</SheetTitle>
                    <SheetDescription>
                      Apply filters to find specific calculations
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-6 py-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Calculation Type</h4>
                      <div className="space-y-2">
                        <Tabs
                          defaultValue={selectedType || "all"}
                          onValueChange={(value) =>
                            setSelectedType(value === "all" ? undefined : value)
                          }
                        >
                          <TabsList className="grid grid-cols-2">
                            <TabsTrigger value="all">All Types</TabsTrigger>
                            <TabsTrigger value="GROWTH_PERCENTILE">
                              Growth Percentile
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Date Range</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Start Date
                          </label>
                          <DatePicker
                            date={dateRange.startDate}
                            setDate={(date) =>
                              setDateRange((prev) => ({
                                ...prev,
                                startDate: date,
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            End Date
                          </label>
                          <DatePicker
                            date={dateRange.endDate}
                            setDate={(date) =>
                              setDateRange((prev) => ({
                                ...prev,
                                endDate: date,
                              }))
                            }
                            className="w-full"
                          />
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

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                <Input
                  placeholder="Search calculations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px] border-medical-200"
                />
              </div>

              {/* Batch Actions (Visible when rows are selected) */}
              {viewMode === "table" && Object.keys(rowSelection).length > 0 && (
                <div className="flex items-center gap-2 ml-2 bg-medical-50 px-3 py-1 rounded-lg">
                  <span className="text-sm text-medical-700">
                    {Object.keys(rowSelection).length} selected
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-medical-700 hover:text-medical-900"
                      onClick={handleSendMultipleReports}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-600 hover:text-red-700"
                      onClick={() => setBatchDeleteModalOpen(true)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Indicators */}
          {(selectedType || dateRange.startDate || dateRange.endDate) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {selectedType.replace(/_/g, " ")}
                  <button
                    className="ml-1 hover:text-medical-600"
                    onClick={() => setSelectedType(undefined)}
                  >
                    ×
                  </button>
                </Badge>
              )}
              {dateRange.startDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  From: {format(dateRange.startDate, "MMM dd, yyyy")}
                  <button
                    className="ml-1 hover:text-medical-600"
                    onClick={() =>
                      setDateRange((prev) => ({
                        ...prev,
                        startDate: undefined,
                      }))
                    }
                  >
                    ×
                  </button>
                </Badge>
              )}
              {dateRange.endDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  To: {format(dateRange.endDate, "MMM dd, yyyy")}
                  <button
                    className="ml-1 hover:text-medical-600"
                    onClick={() =>
                      setDateRange((prev) => ({ ...prev, endDate: undefined }))
                    }
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
              <div className="text-sm font-medium text-medical-600">Total</div>
              <div className="text-xl font-bold text-medical-800">
                {calculations.length}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-md text-center">
              <div className="text-sm font-medium text-green-600">
                Last Month
              </div>
              <div className="text-xl font-bold text-green-800">
                {
                  calculations.filter((c) => {
                    const date = new Date(c.date);
                    const now = new Date();
                    const lastMonth = new Date(
                      now.getFullYear(),
                      now.getMonth() - 1,
                      1
                    );
                    return date >= lastMonth;
                  }).length
                }
              </div>
            </div>
            <div className="bg-amber-50 p-3 rounded-md text-center">
              <div className="text-sm font-medium text-amber-600">Alerts</div>
              <div className="text-xl font-bold text-amber-800">
                {alertsData.length}
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-md text-center">
              <div className="text-sm font-medium text-blue-600">
                Outside Range
              </div>
              <div className="text-xl font-bold text-blue-800">
                {alertsData.filter((a) => a.type === "critical").length}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 lg:p-6">
          {isLoading ? (
            viewMode === "table" ? (
              <CalculationTableSkeleton />
            ) : (
              <CalculationCardSkeleton />
            )
          ) : calculations.length > 0 ? (
            viewMode === "table" ? (
              /* Table View */
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
                        table.getRowModel().rows.map((row) => {
                          // Determine if this row has any alerts
                          const hasHeightAlert =
                            row.original.results?.height?.percentiles
                              ?.calculatedPercentile &&
                            (row.original.results.height.percentiles
                              .calculatedPercentile < 3 ||
                              row.original.results.height.percentiles
                                .calculatedPercentile > 97);
                          const hasWeightAlert =
                            row.original.results?.weight?.percentiles
                              ?.calculatedPercentile &&
                            (row.original.results.weight.percentiles
                              .calculatedPercentile < 3 ||
                              row.original.results.weight.percentiles
                                .calculatedPercentile > 97);
                          const hasHeightWarning =
                            !hasHeightAlert &&
                            row.original.results?.height?.percentiles
                              ?.calculatedPercentile &&
                            (row.original.results.height.percentiles
                              .calculatedPercentile < 10 ||
                              row.original.results.height.percentiles
                                .calculatedPercentile > 90);
                          const hasWeightWarning =
                            !hasWeightAlert &&
                            row.original.results?.weight?.percentiles
                              ?.calculatedPercentile &&
                            (row.original.results.weight.percentiles
                              .calculatedPercentile < 10 ||
                              row.original.results.weight.percentiles
                                .calculatedPercentile > 90);
                          return (
                            <TableRow
                              key={row.id}
                              className={`
                          hover:bg-medical-50
                          ${
                            hasHeightAlert || hasWeightAlert
                              ? "bg-red-50 hover:bg-red-100"
                              : ""
                          }
                          ${
                            !hasHeightAlert &&
                            !hasWeightAlert &&
                            (hasHeightWarning || hasWeightWarning)
                              ? "bg-amber-50 hover:bg-amber-100"
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
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            No calculations found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between space-x-2 pt-4 lg:pt-6">
                  {pagination ? (
                    <div className="flex items-center gap-2 text-sm text-medical-500">
                      Showing {calculations.length} of{" "}
                      {pagination.totalCalculations} calculations
                      {(selectedType ||
                        dateRange.startDate ||
                        dateRange.endDate) &&
                        " (filtered)"}
                    </div>
                  ) : (
                    <div className="text-sm text-medical-500">
                      Showing {table.getRowModel().rows.length} calculations
                    </div>
                  )}
                  <div className="flex gap-2">
                    {pagination && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage <= 1 || actionInProgress}
                          className="border-medical-200 text-medical-700"
                        >
                          {actionInProgress ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Previous"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, pagination.totalPages)
                            )
                          }
                          disabled={
                            currentPage >= pagination.totalPages ||
                            actionInProgress
                          }
                          className="border-medical-200 text-medical-700"
                        >
                          {actionInProgress ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Next"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Card View */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {calculations.map((calc) => {
                    // Determine if this card has any alerts
                    const hasHeightAlert =
                      calc.results?.height?.percentiles?.calculatedPercentile &&
                      (calc.results.height.percentiles.calculatedPercentile <
                        3 ||
                        calc.results.height.percentiles.calculatedPercentile >
                          97);

                    const hasWeightAlert =
                      calc.results?.weight?.percentiles?.calculatedPercentile &&
                      (calc.results.weight.percentiles.calculatedPercentile <
                        3 ||
                        calc.results.weight.percentiles.calculatedPercentile >
                          97);

                    const hasHeightWarning =
                      !hasHeightAlert &&
                      calc.results?.height?.percentiles?.calculatedPercentile &&
                      (calc.results.height.percentiles.calculatedPercentile <
                        10 ||
                        calc.results.height.percentiles.calculatedPercentile >
                          90);

                    const hasWeightWarning =
                      !hasWeightAlert &&
                      calc.results?.weight?.percentiles?.calculatedPercentile &&
                      (calc.results.weight.percentiles.calculatedPercentile <
                        10 ||
                        calc.results.weight.percentiles.calculatedPercentile >
                          90);
                    return (
                      <Card
                        key={calc.id}
                        className={`
                    border hover:shadow-md transition-shadow cursor-pointer
                    ${hasHeightAlert || hasWeightAlert ? "border-red-200" : ""}
                    ${
                      !hasHeightAlert &&
                      !hasWeightAlert &&
                      (hasHeightWarning || hasWeightWarning)
                        ? "border-amber-200"
                        : ""
                    }
                  `}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {calc.type}
                              </Badge>
                              <CardTitle className="text-lg font-heading text-medical-900">
                                {format(new Date(calc.date), "MMMM d, yyyy")}
                              </CardTitle>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/calculations/${calc.id}`
                                    )
                                  }
                                >
                                  <LineChart className="mr-2 h-4 w-4" />
                                  View Chart
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setNotesDialogState({
                                      open: true,
                                      calculationId: calc.id,
                                      notes: calc.notes || "",
                                    });
                                  }}
                                >
                                  <NotebookPen className="mr-2 h-4 w-4" />
                                  Edit Notes
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => {
                                    setDeleteModalState({
                                      open: true,
                                      calculationId: calc.id,
                                    });
                                  }}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-2 gap-2">
                            {/* Height Card */}
                            <div className="p-2 bg-medical-50 rounded-md">
                              <p className="text-xs text-medical-500">Height</p>
                              <p className="text-sm font-medium text-medical-800">
                                {calc.results?.height?.value
                                  ? `${calc.results.height.value} cm`
                                  : "N/A"}
                              </p>
                              {calc.results?.height?.percentiles
                                ?.calculatedPercentile && (
                                <div
                                  className={`text-xs mt-1 py-1 px-2 rounded-full inline-block ${
                                    calc.results.height.percentiles
                                      .calculatedPercentile < 3 ||
                                    calc.results.height.percentiles
                                      .calculatedPercentile > 97
                                      ? "bg-red-100 text-red-800"
                                      : calc.results.height.percentiles
                                          .calculatedPercentile < 10 ||
                                        calc.results.height.percentiles
                                          .calculatedPercentile > 90
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {calc.results.height.percentiles.calculatedPercentile.toFixed(
                                    1
                                  )}
                                  th percentile
                                </div>
                              )}
                            </div>
                            {/* Weight Card */}
                            <div className="p-2 bg-medical-50 rounded-md">
                              <p className="text-xs text-medical-500">Weight</p>
                              <p className="text-sm font-medium text-medical-800">
                                {calc.results?.weight?.value
                                  ? `${calc.results.weight.value} kg`
                                  : "N/A"}
                              </p>
                              {calc.results?.weight?.percentiles
                                ?.calculatedPercentile && (
                                <div
                                  className={`text-xs mt-1 py-1 px-2 rounded-full inline-block ${
                                    calc.results.weight.percentiles
                                      .calculatedPercentile < 3 ||
                                    calc.results.weight.percentiles
                                      .calculatedPercentile > 97
                                      ? "bg-red-100 text-red-800"
                                      : calc.results.weight.percentiles
                                          .calculatedPercentile < 10 ||
                                        calc.results.weight.percentiles
                                          .calculatedPercentile > 90
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {calc.results.weight.percentiles.calculatedPercentile.toFixed(
                                    1
                                  )}
                                  th percentile
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Notes section */}
                          {calc.notes && (
                            <div className="p-2 bg-blue-50 rounded-md mt-2">
                              <p className="text-xs text-blue-500">Notes</p>
                              <p className="text-sm text-blue-800">
                                {calc.notes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="border-t pt-3 flex justify-between">
                          <div className="flex items-center text-xs text-gray-500">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            {format(new Date(calc.date), "MMM d, yyyy")}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              router.push(`/dashboard/calculations/${calc.id}`)
                            }
                          >
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
                {/* Pagination for card view */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage <= 1 || actionInProgress}
                      >
                        {actionInProgress ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Previous"
                        )}
                      </Button>
                      <div className="text-sm text-medical-500">
                        Page {currentPage} of {pagination.totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, pagination.totalPages)
                          )
                        }
                        disabled={
                          currentPage >= pagination.totalPages ||
                          actionInProgress
                        }
                      >
                        {actionInProgress ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Next"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            // Empty state
            <div className="text-center py-12 text-medical-600 bg-medical-50 rounded-lg">
              <Calculator className="h-12 w-12 mx-auto text-medical-400 mb-3" />
              <h3 className="text-lg font-medium mb-2">
                No Calculations Found
              </h3>
              <p className="mb-4">
                {selectedType || dateRange.startDate || dateRange.endDate
                  ? "No calculations match your current filters."
                  : "This patient doesn't have any calculations yet."}
              </p>
              {selectedType || dateRange.startDate || dateRange.endDate ? (
                <Button variant="outline" onClick={resetFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    router.push(
                      `/dashboard/calculations/new?patientId=${patientId}`
                    )
                  }
                  className="bg-medical-600 hover:bg-medical-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Calculation
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Single Calculation Modal */}
      <DeleteModal
        isOpen={deleteModalState.open}
        onOpenChange={(open) => {
          // Only allow closing, not opening
          if (!open) {
            setDeleteModalState((prev) => ({
              ...prev,
              open: false,
            }));
          }
        }}
        title="Delete Calculation"
        description="Are you sure you want to delete this calculation? This action cannot be undone."
        onConfirmDelete={handleDeleteConfirm}
        isLoading={actionInProgress}
      />

      {/* Batch Delete Modal */}
      <DeleteModal
        isOpen={batchDeleteModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBatchDeleteModalOpen(false);
          }
        }}
        title={`Delete ${Object.keys(rowSelection).length} Calculations`}
        description="Are you sure you want to delete the selected calculations? This action cannot be undone."
        onConfirmDelete={handleBatchDeleteConfirm}
        isLoading={actionInProgress}
      />

      {/* Notes Dialog */}
      <Dialog
        open={notesDialogState.open}
        onOpenChange={(open) => {
          if (!open) {
            setNotesDialogState({
              open: false,
              calculationId: null,
              notes: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Calculation Notes</DialogTitle>
            <DialogDescription>
              Add or edit notes for this calculation.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Textarea
              value={notesDialogState.notes}
              onChange={(e) =>
                setNotesDialogState((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Enter notes about this calculation..."
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setNotesDialogState({
                  open: false,
                  calculationId: null,
                  notes: "",
                })
              }
              disabled={actionInProgress}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={actionInProgress}>
              {actionInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Notes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Report Dialog */}
      <SendEmailReportDialog
        isOpen={emailReportDialogOpen}
        onClose={() => {
          setEmailReportDialogOpen(false);
          setSelectedCalculations([]);
        }}
        chartData={
          selectedCalculations.length > 0
            ? {
                calculationId: selectedCalculations[0].id,
                patientDetails: {
                  name: `${selectedCalculations[0].patient.firstName} ${selectedCalculations[0].patient.lastName}`,
                  email: selectedCalculations[0].patient.email ?? null,
                  guardianEmail:
                    selectedCalculations[0].patient.guardianEmail ?? null,
                },
                calculationIds: selectedCalculations.map((calc) => calc.id),
              }
            : null
        }
        patientId={patientId}
        pdfUrls={selectedCalculations.map(
          (calc) => calc.charts?.[0]?.pdfUrl || ""
        )}
        multiple={selectedCalculations.length > 1}
      />
    </div>
  );
};

export default PatientCalculationTable;
