"use client";
import React, { useEffect, useState } from "react";
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
  MoreHorizontal,
  RefreshCw,
  Trash2,
  FileText,
  ArrowUpDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

// Define a type for email notifications
interface EmailNotification {
  id: string;
  type: string;
  sentAt: string;
  status: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  chart?: {
    id: string;
    pdfUrl?: string;
  };
  pdfUrl?: string;
  openedAt?: string;
  clickedAt?: string;
  deliveryAttempts: number;
}

type ColumnDef<TData> = ReactTableColumnDef<TData, any> & {
  accessorKey?: string;
  id?: string;
};

export default function EmailNotificationsTable({
  notifications,
  onResend,
  onDelete,
}: {
  notifications: EmailNotification[];
  onResend: (params: { notificationId: string; patientId: string }) => void;
  onDelete: (params: { notificationId: string; patientId: string }) => void;
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

  const columns: ColumnDef<EmailNotification>[] = [
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
            Notification Type
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
      accessorKey: "sentAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent text-medical-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sent Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => new Date(row.original.sentAt).toLocaleString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "SENT"
              ? "default"
              : row.original.status === "FAILED"
              ? "destructive"
              : "outline"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Delivery Attempts",
      accessorKey: "deliveryAttempts",
    },
    {
      header: "Opened",
      accessorFn: (row) => row.openedAt ? "Yes" : "No",
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
              onClick={() => {
                onResend({
                  notificationId: row.original.id,
                  patientId: row.original.patient.id,
                });
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Notification
            </DropdownMenuItem>
            {(row.original.pdfUrl || row.original.chart?.pdfUrl) && (
              <DropdownMenuItem
                onClick={() => {
                  const pdfUrl = row.original.pdfUrl || row.original.chart?.pdfUrl;
                  if (pdfUrl) window.open(pdfUrl, "_blank");
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                View PDF
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onDelete({
                  notificationId: row.original.id,
                  patientId: row.original.patient.id,
                });
              }}
              className="text-red-600 focus:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Notification
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: notifications,
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
      <CardHeader className="p-4 lg:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-heading text-medical-900">
              Email Notifications
            </CardTitle>
            <CardDescription>
              View and manage email notifications sent to patients
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 lg:p-6">
        {notifications.length > 0 ? (
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
                        No email notifications found.
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
            No email notifications found. New notifications will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}