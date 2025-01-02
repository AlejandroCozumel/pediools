import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4 text-medical-500" })}
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-bold">{value}</div>
        {percentageChange !== null && (
          <p className={`text-xs ${isUp ? 'text-green-500' : 'text-red-500'} flex items-center`}>
            {isUp ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
            {Math.abs(percentageChange).toFixed(2)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;