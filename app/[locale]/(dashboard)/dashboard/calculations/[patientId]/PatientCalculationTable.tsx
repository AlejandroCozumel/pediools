"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { DeleteModal } from "@/components/DeleteModal";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  MoreHorizontal,
  LineChart,
  ArrowUpDown,
  Trash,
  Send,
  FileText,
  NotebookPen,
  ChevronDown,
  Info,
  AlertTriangle,
  Check,
  ArrowUpRightFromSquare,
  CheckSquare,
  Loader2,
} from "lucide-react";
import SendEmailReportDialog from "@/components/SendEmailReportDialog";
import { useToast } from "@/hooks/use-toast";

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

// Props interface for PatientCalculationTable
interface PatientCalculationTableProps {
  patientId: string;
  type: string;
  calculations: Calculation[];
  onDeleteCalculation: DeleteCalculationMutation;
  onBatchDeleteCalculations: BatchDeleteCalculationsMutation;
  onUpdateNotes: UpdateCalculationNotesMutation;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
}

export default function PatientCalculationTable({
  patientId,
  type,
  calculations,
  onDeleteCalculation,
  onBatchDeleteCalculations,
  onUpdateNotes,
  pagination,
  onPageChange,
}: PatientCalculationTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // State for modals and dialogs
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

  // State for actions in progress
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    setGlobalFilter(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Handle single item deletion
  const handleDeleteConfirm = () => {
    if (deleteModalState.calculationId) {
      setActionInProgress(true);
      try {
        onDeleteCalculation.mutate({
          patientId,
          calculationId: deleteModalState.calculationId,
        });

        toast({
          title: "Calculation Deleted",
          description: "The calculation has been successfully removed.",
          variant: "default",
        });

        setDeleteModalState({ open: false, calculationId: null });
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Unable to delete the calculation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setActionInProgress(false);
      }
    }
  };

  // Handle batch deletion
  const handleBatchDeleteConfirm = () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length > 0) {
      setActionInProgress(true);
      try {
        onBatchDeleteCalculations.mutate({
          patientId,
          calculationIds: selectedIds,
        });

        toast({
          title: `${selectedIds.length} Calculations Deleted`,
          description:
            "The selected calculations have been successfully removed.",
          variant: "default",
        });

        setBatchDeleteModalOpen(false);
        setRowSelection({});
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Unable to delete the calculations. Please try again.",
          variant: "destructive",
        });
      } finally {
        setActionInProgress(false);
      }
    }
  };

  // Handle notes save
  const handleSaveNotes = () => {
    if (notesDialogState.calculationId) {
      setActionInProgress(true);
      try {
        onUpdateNotes.mutate({
          patientId,
          calculationId: notesDialogState.calculationId,
          notes: notesDialogState.notes,
        });

        toast({
          title: "Notes Updated",
          description: "The calculation notes have been successfully saved.",
          variant: "default",
        });

        setNotesDialogState({ open: false, calculationId: null, notes: "" });
      } catch (error) {
        toast({
          title: "Save Failed",
          description: "Unable to save the notes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setActionInProgress(false);
      }
    }
  };

  // Generate sparkline data for weight/height trends
  const generateSparklineData = (field: "weight" | "height") => {
    const data = calculations
      .filter((calc) => calc.results && calc.results[field]?.value)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((calc) => ({
        date: new Date(calc.date),
        value: calc.results[field]?.value || 0,
      }));

    return data;
  };

  // Set up columns
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
                      className="h-8 w-8 p-0 text-medical-400"
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
                const chartTypeMap = {
                  GROWTH_PERCENTILE: "cdc-growth-chart",
                  DEFAULT: "cdc-growth-chart",
                };

                const chartType =
                  chartTypeMap[
                    row.original.type as keyof typeof chartTypeMap
                  ] || chartTypeMap.DEFAULT;

                const weightData = JSON.stringify({
                  gender: row.original.patient.gender.toLowerCase(),
                  dateOfBirth: row.original.patient.dateOfBirth,
                  measurements: [
                    {
                      date: row.original.date,
                      weight: row.original.results.weight?.value,
                    },
                  ],
                  type: "weight",
                });

                const heightData = JSON.stringify({
                  gender: row.original.patient.gender.toLowerCase(),
                  dateOfBirth: row.original.patient.dateOfBirth,
                  measurements: [
                    {
                      date: row.original.date,
                      height: row.original.results.height?.value,
                    },
                  ],
                  type: "height",
                });

                const calculationParams = new URLSearchParams({
                  weightData,
                  heightData,
                  patientId: row.original.patientId,
                  calculationId: row.original.id,
                });

                // Navigate to the charts page with the encoded parameters
                router.push(
                  `/charts/${chartType}?${calculationParams.toString()}`
                );
              }}
            >
              <LineChart className="mr-2 h-4 w-4" />
              View Chart
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Email Report */}
            <DropdownMenuItem
              onClick={() => {
                const pdfUrl = row.original.charts?.[0]?.pdfUrl;
                if (pdfUrl) {
                  // Set up single calculation for email
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
                // Assuming the PDF URL is stored in the chart
                const pdfUrl = row.original.charts?.[0]?.pdfUrl;

                if (pdfUrl) {
                  // Create a temporary anchor element to trigger download
                  const link = document.createElement("a");
                  link.href = pdfUrl;
                  link.download = `calculation_report_${row.original.id}.pdf`;
                  link.target = "_blank";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else {
                  // Optional: Show a toast or alert that no PDF is available
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
              className="text-red-500 focus:bg-red-500 focus:text-white "
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Calculation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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

  // Prepare data for multi-calculation email
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

  return (
    <>
      <Card className="border-medical-100">
        <CardHeader className="p-4 lg:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-heading text-medical-900">
                {type}
              </CardTitle>
              <CardDescription>
                View and manage this patient's calculations
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Batch Actions (Visible when rows are selected) */}
              {Object.keys(rowSelection).length > 0 && (
                <div className="flex items-center gap-2 mr-2 bg-medical-50 px-3 py-1 rounded-lg">
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
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 lg:p-6">
          {calculations.length > 0 ? (
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
                        <TableRow key={row.id} className="hover:bg-medical-50">
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
                  </div>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  {pagination && onPageChange ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onPageChange(
                            Math.min(
                              pagination.currentPage + 1,
                              pagination.totalPages
                            )
                          )
                        }
                        disabled={
                          pagination.currentPage >= pagination.totalPages ||
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
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={
                          !table.getCanPreviousPage() || actionInProgress
                        }
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
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage() || actionInProgress}
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
            <div className="text-center py-8 text-medical-600">
              No calculations found for this patient.
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
    </>
  );
}
