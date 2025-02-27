// app/dashboard/appointments/components/AppointmentsSkeleton.tsx
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const AppointmentsSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Calendar Skeleton */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          <Skeleton className="h-[336px] w-full rounded-md" />
        </div>

        <div className="lg:w-1/3 space-y-4">
          <Skeleton className="h-8 w-3/4" />

          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      </div>

      {/* List Skeleton (hidden initially) */}
      <div className="hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full divide-y divide-medical-100">
            {/* Table Header */}
            <div className="flex bg-medical-50 h-10 items-center">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className={`px-4 ${i === 4 ? 'ml-auto' : 'flex-1'}`}>
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>

            {/* Table Rows */}
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex h-16 items-center border-b">
                {Array(5).fill(0).map((_, j) => (
                  <div key={j} className={`px-4 ${j === 4 ? 'ml-auto' : 'flex-1'}`}>
                    <Skeleton className="h-4 w-3/4" />
                    {j === 0 || j === 1 ? <Skeleton className="h-3 w-1/2 mt-2" /> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsSkeleton;