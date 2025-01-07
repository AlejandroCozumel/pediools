// components/SubscriptionStatus.tsx
"use client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Package2, Activity } from "lucide-react";

interface SubscriptionData {
  status: string;
  plan: string;
  currentPeriodEnd: string;
}

interface SubscriptionStatusProps {
  data: SubscriptionData;
}

export function SubscriptionStatus({ data }: SubscriptionStatusProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-medical-200 relative overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="relative p-3">
          <div className="flex items-center justify-between mb-2">
            <Package2 className="h-4 w-4 text-medical-500" />
            <Badge
              variant="default"
              className="text-xs bg-medical-600 hover:bg-medical-700 transition-colors"
            >
              Plan
            </Badge>
          </div>
          <CardTitle className="text-sm mb-1 text-medical-900 group-hover:text-medical-700 transition-colors font-heading">
            {data.plan}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground/80 leading-relaxed">
            Your current subscription plan
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-medical-200 relative overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="relative p-3">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-4 w-4 text-medical-500" />
            <Badge
              variant={
                data.status.toLowerCase() === "active" ? "default" : "secondary"
              }
              className="text-xs bg-medical-600 hover:bg-medical-700 transition-colors"
            >
              Status
            </Badge>
          </div>
          <CardTitle className="text-sm mb-1 text-medical-900 group-hover:text-medical-700 transition-colors font-heading">
            {data.status}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground/80 leading-relaxed">
            Current subscription status
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-medical-200 relative overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="relative p-3">
          <div className="flex items-center justify-between mb-2">
            <CalendarDays className="h-4 w-4 text-medical-500" />
            <Badge
              variant="default"
              className="text-xs bg-medical-600 hover:bg-medical-700 transition-colors"
            >
              Period
            </Badge>
          </div>
          <CardTitle className="text-sm mb-1 text-medical-900 group-hover:text-medical-700 transition-colors font-heading">
            Ends {new Date(data.currentPeriodEnd).toLocaleDateString()}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground/80 leading-relaxed">
            Current billing period end date
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
