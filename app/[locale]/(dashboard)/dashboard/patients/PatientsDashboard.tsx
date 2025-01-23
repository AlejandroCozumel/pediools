"use client";
import React from "react";
import { useTranslations } from "next-intl";
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
  Calendar,
  ArrowUpDown,
  Calculator,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Define a type for patients to improve type safety
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  lastCalculation?: string | null;
  lastVisit?: string | null;
  status: string;
}

type ColumnDef<TData> = ReactTableColumnDef<TData, any> & {
  accessorKey?: string;
  id?: string;
};

export default function PatientsDashboard({
  patients,
}: {
  patients: Patient[];
}) {
  const t = useTranslations("Patients.table");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");

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

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent text-medical-700"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("columns.patientName")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => `${row.original.firstName}`,
    },
    {
      accessorKey: "age",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent text-medical-700"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("columns.lastVisit")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) =>
        row.original.lastVisit
          ? new Date(row.original.lastVisit).toLocaleDateString()
          : t("noVisits"),
    },
    {
      accessorKey: "lastCalculation",
      header: t("columns.lastCalculation"),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="border-medical-200 text-medical-700"
        >
          {row.original.lastCalculation || t("noCalculation")}
        </Badge>
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
        const router = useRouter();
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/calculations/${row.original.id}`)
                }
              >
                <Calculator className="mr-2 h-4 w-4" />
                {t("actions.viewCalculations")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: patients,
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

  // Calculate statistics
  const totalPatients = patients.length;
  const activePatients = patients.filter((p) => p.status === "Active").length;
  const recentUpdates = patients.filter(
    (p) =>
      p.lastVisit &&
      new Date(p.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div>
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
            <div className="flex items-center gap-4">
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
          </div>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
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
                          No results.
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
            </>
          ) : (
            <div className="text-center py-8 text-medical-600">
              {t("noPatients")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
