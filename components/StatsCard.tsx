import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface StatProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatProps> = ({ title, value, previousValue, icon }) => {
  const percentageChange = previousValue ? ((value - previousValue) / previousValue) * 100 : null;
  const isUp = percentageChange ? percentageChange > 0 : null;

  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-medical-200 relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="relative p-3">
        <div className="flex items-center justify-between mb-2">
          {React.cloneElement(icon as React.ReactElement, {
            className: "h-4 w-4 text-medical-500",
          })}
          {percentageChange !== null && (
            <Badge
              variant="default"
              className={`text-xs ${
                isUp ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              } transition-colors flex items-center`}
            >
              {isUp ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
              {Math.abs(percentageChange).toFixed(2)}%
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm mb-1 text-medical-900 group-hover:text-medical-700 transition-colors font-heading">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80 leading-relaxed">
          Total: {value}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default StatsCard;