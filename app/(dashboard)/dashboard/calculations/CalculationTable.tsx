"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
import {
  Search,
  Plus,
  MoreHorizontal,
  LineChart,
  FileText,
  ArrowUpDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

// Define a type for calculations to improve type safety
interface Calculation {
  id: string;
  type: string;
  date: string;
  results: any;
  patientId: string;
  patient: {
    firstName: string;
    lastName: string;
  };
}

type ColumnDef<TData> = ReactTableColumnDef<TData, any> & {
  accessorKey?: string;
  id?: string;
};

interface Calculation {
  id: string;
  type: string;
  date: string;
  results: any;
  patientId: string;
  patientName?: string;
}

export default function CalculationTable({
  calculations,
  patientId,
}: {
  calculations: Calculation[];
  patientId?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setGlobalFilter(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const [globalFilter, setGlobalFilter] = React.useState("");

  const router = useRouter();

  const columns: ColumnDef<Calculation>[] = [
    {
      accessorKey: "patient.firstName",
      header: "First Name",
    },
    {
      accessorKey: "patient.lastName",
      header: "Last Name",
    },
    {
      accessorKey: "type",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-medical-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Calculation Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
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
          {getValue()}
        </Badge>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-medical-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
    },
    {
      header: "Height",
      accessorFn: (row) => row.results?.height?.value,
    },
    {
      header: "Weight",
      accessorFn: (row) => row.results?.weight?.value,
    },
    {
      header: "Height Percentile",
      accessorFn: (row) =>
        row.results?.height?.percentiles?.calculatedPercentile,
      cell: ({ getValue }) => `${getValue().toFixed(2)}P`,
    },
    {
      header: "Weight Percentile",
      accessorFn: (row) =>
        row.results?.weight?.percentiles?.calculatedPercentile,
      cell: ({ getValue }) => `${getValue().toFixed(2)}P`,
    },
    {
      header: "Height Z-Score",
      accessorFn: (row) => row.results?.height?.percentiles?.zScore,
      cell: ({ getValue }) => getValue().toFixed(2),
    },
    {
      header: "Weight Z-Score",
      accessorFn: (row) => row.results?.weight?.percentiles?.zScore,
      cell: ({ getValue }) => getValue().toFixed(2),
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
              onClick={() =>
                router.push(
                  `/dashboard/patients/${row.original.patientId}/calculations/${row.original.id}`
                )
              }
            >
              <LineChart className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // TODO: Implement PDF export functionality
                console.log("Export PDF", row.original);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
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
    globalFilterFn: (row, columnId, filterValue) => {
      const fullName =
        `${row.original.patient.firstName} ${row.original.patient.lastName}`.toLowerCase();
      return fullName.includes(filterValue.toLowerCase());
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <Card className="border-medical-100">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-heading text-medical-900">
              {patientId ? "Patient Calculations" : "Latest Calculations"}
            </CardTitle>
            <CardDescription>
              {patientId
                ? "View and manage this patient's calculations"
                : "View and manage recent patient calculations"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
              <Input
                placeholder="Search by patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[250px] border-medical-200"
              />
            </div>
            {patientId && (
              <Button
                className="bg-medical-600 hover:bg-medical-700"
                onClick={() =>
                  router.push(
                    `/dashboard/patients/${patientId}/calculations/add`
                  )
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Calculation
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
            <div className="flex items-center justify-end space-x-2 py-4">
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
            {patientId
              ? "No calculations found for this patient."
              : "No calculations found. Add a new calculation to get started."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
