import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface RangeIndicatorProps {
  value: number;
  min: number;
  max: number;
  normal: number;
  isWeight?: boolean;
}

export function RangeIndicator({
  value,
  min,
  max,
  normal,
  isWeight = false,
}: RangeIndicatorProps) {
  // Ensure the range centers `normal`
  const rangePadding = Math.max(max - normal, normal - min);
  const adjustedMin = normal - rangePadding;
  const adjustedMax = normal + rangePadding;

  // Constrain the value to the adjusted range
  const constrainedValue = Math.min(Math.max(value, adjustedMin), adjustedMax);

  // Calculate relative positions
  const normalPosition = 50; // Normal marker is always at the center
  const position =
    ((constrainedValue - adjustedMin) / (adjustedMax - adjustedMin)) * 100;

  let markerColor = "bg-medical-600";
  let markerDirection: React.ReactNode = null;
  if (value < adjustedMin) {
    markerColor = "bg-red-600";
    markerDirection = <ArrowLeft className="h-4 w-4 text-red-600" />;
  } else if (value > adjustedMax) {
    markerColor = "bg-red-600";
    markerDirection = <ArrowRight className="h-4 w-4 text-red-600" />;
  }

  const formatValue = (val: number) => isWeight ? val.toFixed(2) : val.toFixed(1);

  return (
    <div className="mt-2">
      <div className="relative h-2 bg-gray-100 rounded-full">
        {/* Gradient background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-100 via-green-100 to-yellow-100" />

        {/* Normal marker always at the center */}
        <div
          className="absolute w-0.5 h-4 -top-1 bg-gray-400 transform -translate-x-1/2"
          style={{ left: `${normalPosition}%` }}
        />

        {/* Value marker */}
        <div
          className={cn(
            "absolute w-2 h-4 -top-1 rounded-full transition-all duration-300 transform -translate-x-1/2 flex items-center justify-center",
            markerColor
          )}
          style={{ left: `${position}%` }}
        >
          {markerDirection}
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
      <span>{formatValue(adjustedMin)}</span>
        <span className="text-gray-500">{formatValue(normal)}</span>
        <span>{formatValue(adjustedMax)}</span>
      </div>
    </div>
  );
}
