"use client";

import React from "react";
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
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Calendar,
  LineChart,
  FileText,
  Mail,
  ArrowUpDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PatientQuickActions from "@/app/(dashboard)/dashboard/patients/[patientId]/PatientQuickActions";

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
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-medical-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Patient Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => `${row.original.firstName}`,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-medical-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Patient Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => `${row.original.lastName}`,
    },
    {
      accessorKey: "age",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-medical-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Age
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => calculateAge(row.original.dateOfBirth),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <div className="text-medical-600">{row.original.gender}</div>
      ),
    },
    {
      accessorKey: "lastVisit",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-medical-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Visit
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) =>
        row.original.lastVisit
          ? new Date(row.original.lastVisit).toLocaleDateString()
          : "No visits",
    },
    {
      accessorKey: "lastCalculation",
      header: "Last Calculation",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="border-medical-200 text-medical-700"
        >
          {row.original.lastCalculation || "No calculation"}
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
      header: "Actions",
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/patients/${row.original.id}`)
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Details
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
    <div className="container mx-auto my-6">
      {/* Header Section */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight font-heading text-medical-900">
          Patients
        </h1>
        <p className="text-medical-600 text-lg leading-relaxed">
          Manage and monitor your patient records
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <PatientQuickActions
          actions={[
            {
              link: `/dashboard/patients/calculations`,
              icon: <LineChart className="h-8 w-8 text-medical-500" />,
              title: "Calculations",
              description: "View patient's growth charts and calculations",
              category: "Graphs",
            },
            {
              link: `/dashboard/patients/appointments`,
              icon: <Calendar className="h-8 w-8 text-medical-500" />,
              title: "Appointments",
              description: "Manage patient appointments",
              category: "Scheduling",
            },
            {
              link: `/dashboard/patients/documents`,
              icon: <FileText className="h-8 w-8 text-medical-500" />,
              title: "Documents",
              description: "View and manage patient documents",
              category: "Records",
            },
          ]}
        />

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="#" className="block group">
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-medical-600">
                Total Patients
              </CardTitle>
              <Users className="h-4 w-4 text-medical-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-medical-900">
                {totalPatients}
              </div>
              <p className="text-xs text-medical-600 mt-1">Total patients</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="#" className="block group">
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-medical-600">
                Active Patients
              </CardTitle>
              <Users className="h-4 w-4 text-medical-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-medical-900">
                {activePatients}
              </div>
              <p className="text-xs text-medical-600 mt-1">Active patients</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="#" className="block group">
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-medical-600">
                Recent Updates
              </CardTitle>
              <LineChart className="h-4 w-4 text-medical-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-medical-900">
                {recentUpdates}
              </div>
              <p className="text-xs text-medical-600 mt-1">Updates this week</p>
            </CardContent>
          </Card>
        </Link>
      </div> */}

        {/* Main Content Card */}
        <Card className="border-medical-100">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-heading text-medical-900">
                  Patient List
                </CardTitle>
                <CardDescription>
                  Manage your patients and their records
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-medical-500" />
                  <Input
                    placeholder="Search patients..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-8 w-[250px] border-medical-200"
                  />
                </div>
                <Link href="/dashboard/patients/add">
                  <Button className="bg-medical-600 hover:bg-medical-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </Button>
                </Link>
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
                          <TableRow
                            key={row.id}
                            className="hover:bg-medical-50"
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
                No patients found. Add a new patient to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
