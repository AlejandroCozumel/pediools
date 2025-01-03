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
} from "@tanstack/react-table";
import { useCalculations } from "@/hooks/use-calculations";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MoreHorizontal,
  LineChart,
  ArrowUpDown,
  Trash,
} from "lucide-react";

// Define Calculation type
interface Calculation {
  id: string;
  type: string;
  date: string;
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
  patient: {
    firstName: string;
    lastName: string;
    gender: "male" | "female";
    dateOfBirth: string;
  };
}

interface PatientCalculationTableProps {
  patientId: string;
  type: string;
  calculations: Calculation[];
}

export default function PatientCalculationTable({
  patientId,
  type,
  calculations,
}: PatientCalculationTableProps) {
  const router = useRouter();
  const { deleteCalculation } = useCalculations(patientId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteModalState, setDeleteModalState] = useState<{
    open: boolean;
    calculationId: string | null;
  }>({ open: false, calculationId: null });

  useEffect(() => {
    setGlobalFilter(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handleDeleteConfirm = () => {
    if (deleteModalState.calculationId) {
      deleteCalculation.mutate({
        patientId,
        calculationId: deleteModalState.calculationId,
      });
      setDeleteModalState({ open: false, calculationId: null });
    }
  };

  const columns: ColumnDef<Calculation>[] = [
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
    {
      header: "Height",
      accessorFn: (row) => row.results?.height?.value ?? "N/A",
      cell: ({ getValue }) => String(getValue()),
    },
    {
      header: "Weight",
      accessorFn: (row) => row.results?.weight?.value ?? "N/A",
      cell: ({ getValue }) => String(getValue()),
    },
    {
      header: "Height Percentile",
      accessorFn: (row) =>
        row.results?.height?.percentiles?.calculatedPercentile ?? "N/A",
      cell: ({ getValue }) => {
        const value = getValue();
        return typeof value === "number"
          ? `${value.toFixed(2)}P`
          : String(value);
      },
    },
    {
      header: "Weight Percentile",
      accessorFn: (row) =>
        row.results?.weight?.percentiles?.calculatedPercentile ?? "N/A",
      cell: ({ getValue }) => {
        const value = getValue();
        return typeof value === "number"
          ? `${value.toFixed(2)}P`
          : String(value);
      },
    },
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
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault(); // Prevent dropdown from closing
                setDeleteModalState({
                  open: true,
                  calculationId: row.original.id,
                });
              }}
              className="text-red-500 focus:bg-red-50"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Calculation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                const calculatorType = row.original.results.calculationType;
                const heightData = row.original.results.height;
                const weightData = row.original.results.weight;

                // TODO: Implement chart navigation logic
                console.log("View Chart", {
                  calculatorType,
                  heightData,
                  weightData,
                });
              }}
            >
              <LineChart className="mr-2 h-4 w-4" />
              View Chart
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
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

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
            <div className="flex items-center gap-4">
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
              <div className="flex items-center justify-end space-x-2 pt-4 lg:pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="border-medical-200 text-medical-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="border-medical-200 text-medical-700"
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-medical-600">
              No calculations found for this patient.
            </div>
          )}
        </CardContent>
      </Card>
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
      />
    </>
  );
}
