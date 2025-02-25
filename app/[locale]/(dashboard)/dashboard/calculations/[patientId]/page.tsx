"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import LoaderSpinner from "@/components/LoaderSpinnner";
import DashboardTitle from "@/components/DashboardTitle";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Plus,
  Calendar,
  ChevronDown,
  Filter,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import PatientCalculationTable from "./PatientCalculationTable";
import { useCalculations,
  UseCalculationsOptions,
  CalculationFilters
} from "@/hooks/use-calculations";

const PatientCalculations = () => {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    startDate: undefined,
    endDate: undefined
  });

  // Prepare query options
  const options: UseCalculationsOptions = {
    filters: {
      type: selectedType,
      startDate: dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : undefined,
      endDate: dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : undefined
    },
    pagination: {
      page: currentPage,
      limit
    },
    includeCharts: true
  };

  // Use the enhanced hook
  const {
    calculations,
    pagination,
    isLoading,
    error,
    deleteCalculation,
    batchDeleteCalculations,
    updateCalculationNotes
  } = useCalculations(patientId, options);

  // Filter reset handler
  const resetFilters = () => {
    setSelectedType(undefined);
    setDateRange({ startDate: undefined, endDate: undefined });
    setCurrentPage(1);
  };

  // Handler for "New Calculation" button
  const handleNewCalculation = () => {
    router.push(`/dashboard/calculations/new?patientId=${patientId}`);
  };

  // Skeleton loader for calculations
  const CalculationSkeleton = () => (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/4" />
            </div>
            <Skeleton className="h-[300px] w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-9 w-28 mr-2" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Error handling
  if (error) {
    return (
      <div className="text-center text-medical-600">
        Error loading calculations: {error.message}
      </div>
    );
  }

  return (
    <div className="my-6">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <DashboardTitle
          title="Patient Calculations"
          subtitle="View and manage calculations for this patient"
        />

        <div className="flex flex-wrap gap-2">
          {/* Filters Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex gap-2 items-center">
                <Filter className="h-4 w-4" />
                Filters
                {(selectedType || dateRange.startDate || dateRange.endDate) && (
                  <Badge variant="secondary" className="ml-1">
                    {[
                      selectedType ? 1 : 0,
                      dateRange.startDate ? 1 : 0,
                      dateRange.endDate ? 1 : 0
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

              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Calculation Type</h4>
                  <Tabs defaultValue={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? undefined : value)}>
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="all">All Types</TabsTrigger>
                      <TabsTrigger value="GROWTH_PERCENTILE">Growth Percentile</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Date Range</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Start Date</label>
                      <DatePicker
                        date={dateRange.startDate}
                        setDate={(date) =>
                          setDateRange(prev => ({ ...prev, startDate: date }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">End Date</label>
                      <DatePicker
                        date={dateRange.endDate}
                        setDate={(date) =>
                          setDateRange(prev => ({ ...prev, endDate: date }))
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                  <SheetTrigger asChild>
                    <Button>Apply Filters</Button>
                  </SheetTrigger>
                </div>
              </div>
            </SheetContent>
          </Sheet>

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
              <DropdownMenuItem onClick={handleNewCalculation}>
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
            </Badge>
          )}
          {dateRange.startDate && (
            <Badge variant="secondary" className="flex items-center gap-1">
              From: {format(dateRange.startDate, 'MMM dd, yyyy')}
            </Badge>
          )}
          {dateRange.endDate && (
            <Badge variant="secondary" className="flex items-center gap-1">
              To: {format(dateRange.endDate, 'MMM dd, yyyy')}
            </Badge>
          )}
        </div>
      )}

      {/* Skeleton loader while loading */}
      {isLoading ? (
        <>
          <CalculationSkeleton />
          <CalculationSkeleton />
        </>
      ) : calculations && Object.keys(calculations).length > 0 ? (
        <>
          {Object.entries(calculations).map(([type, typeCalculations]) => (
            <div key={type} className="mt-6">
              <PatientCalculationTable
                type={type.replace(/_/g, " ")}
                patientId={patientId}
                calculations={typeCalculations}
                onDeleteCalculation={deleteCalculation}
                onBatchDeleteCalculations={batchDeleteCalculations}
                onUpdateNotes={updateCalculationNotes}
                pagination={pagination}
                onPageChange={setCurrentPage}
              />
            </div>
          ))}

          {/* Pagination controls if needed */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1 || isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Previous"}
                </Button>
                <div className="text-sm">
                  Page {currentPage} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={currentPage >= pagination.totalPages || isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next"}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-medical-600 bg-medical-50 rounded-lg">
          <Calculator className="h-12 w-12 mx-auto text-medical-400 mb-3" />
          <h3 className="text-lg font-medium mb-2">No Calculations Found</h3>
          <p className="mb-4">
            {(selectedType || dateRange.startDate || dateRange.endDate)
              ? "No calculations match your current filters."
              : "This patient doesn't have any calculations yet."}
          </p>
          {(selectedType || dateRange.startDate || dateRange.endDate) ? (
            <Button variant="outline" onClick={resetFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={handleNewCalculation}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Calculation
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientCalculations;