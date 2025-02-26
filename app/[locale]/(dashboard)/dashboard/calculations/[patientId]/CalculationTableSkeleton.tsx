import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const CalculationTableSkeleton = () => {
  return (
    <>
      {/* Header Section Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Main Content Skeleton */}
      <Card className="border-medical-100">
        <CardHeader className="p-4 lg:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Skeleton className="h-7 w-56 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>

          {/* Key Indicators Row Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            <div className="bg-medical-50 p-3 rounded-md">
              <Skeleton className="h-5 w-16 mb-1" />
              <Skeleton className="h-8 w-10" />
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <Skeleton className="h-5 w-20 mb-1" />
              <Skeleton className="h-8 w-10" />
            </div>
            <div className="bg-amber-50 p-3 rounded-md">
              <Skeleton className="h-5 w-16 mb-1" />
              <Skeleton className="h-8 w-10" />
            </div>
            <div className="bg-red-50 p-3 rounded-md">
              <Skeleton className="h-5 w-28 mb-1" />
              <Skeleton className="h-8 w-10" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-[160px]" />
              <Skeleton className="h-10 w-28" />
            </div>
            <Skeleton className="h-10 w-[250px]" />
          </div>
        </CardHeader>

        <CardContent className="p-4 lg:p-6">
          <div className="rounded-md border border-medical-100">
            {/* Table Header Skeleton */}
            <div className="h-12 border-b bg-medical-50 grid grid-cols-9 gap-4 px-4 items-center">
              {Array(9).fill(0).map((_, i) => (
                <Skeleton key={`header-${i}`} className="h-5 w-full" />
              ))}
            </div>

            {/* Table Rows Skeleton */}
            {Array(5).fill(0).map((_, i) => (
              <div key={`row-${i}`} className="h-16 border-b grid grid-cols-9 gap-4 px-4 items-center">
                {Array(9).fill(0).map((_, j) => (
                  <Skeleton key={`cell-${i}-${j}`} className="h-5 w-full" />
                ))}
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex justify-between items-center mt-4">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default CalculationTableSkeleton;