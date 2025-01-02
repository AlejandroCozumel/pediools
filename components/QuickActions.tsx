import React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type QuickAction = {
  link: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  category: string;
  standards?: string[];
};

type PatientQuickActionsProps = {
  actions: QuickAction[];
};

const PatientQuickActions: React.FC<PatientQuickActionsProps> = ({
  actions,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {actions.map((action, index) => (
      <Link href={action.link} key={index} className="block group">
        <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative p-3">
            <div className="flex items-center justify-between mb-2">
              {React.cloneElement(action.icon as React.ReactElement, {
                className: "h-4 w-4 text-medical-500",
              })}
              <Badge
                variant="default"
                className="text-xs bg-medical-600 hover:bg-medical-700 transition-colors"
              >
                {action.category}
              </Badge>
            </div>
            <CardTitle className="text-sm mb-1 text-medical-900 group-hover:text-medical-700 transition-colors font-heading">
              {action.title}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground/80 leading-relaxed">
              {action.description}
            </CardDescription>
          </CardHeader>
          {action.standards && (
            <CardContent className="relative p-3 pt-0">
              <div className="flex gap-1 flex-wrap">
                {action.standards.map((standard, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs border-medical-200 text-medical-700 hover:bg-medical-50 hover:text-medical-800 transition-colors"
                  >
                    {standard}
                  </Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </Link>
    ))}
  </div>
);

export default PatientQuickActions;
