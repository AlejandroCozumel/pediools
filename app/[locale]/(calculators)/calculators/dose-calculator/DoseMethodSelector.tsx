"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calculator, Weight, Activity, Maximize } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WeightBasedDoseForm } from "./WeightBasedDoseForm";
import { BSABasedDoseForm } from "./BSABasedDoseForm";
import { BSANormalizedDoseForm } from "./BSANormalizedDoseForm";

const doseMethods = [
  {
    id: "weight",
    name: "Weight-based",
    description: "mg/kg dosing",
    icon: Weight,
    details: "Based only on patient weight",
    note: "Most common pediatric dosing method"
  },
  {
    id: "bsa",
    name: "BSA-based",
    description: "mg/m² dosing",
    icon: Activity,
    details: "Based on weight + height (BSA)",
    note: "Used for chemotherapy and high-risk medications"
  },
  {
    id: "bsa_normalized",
    name: "BSA-normalized",
    description: "Normalized to 1.73 m²",
    icon: Maximize,
    details: "Uses total BSA, normalized to standard adult BSA",
    note: "Common for renal function adjustments"
  }
];

export function DoseMethodSelector() {
  const [selectedMethod, setSelectedMethod] = useState("weight");

  return (
    <Card className="w-full mx-auto max-w-6xl">
      <CardHeader className="p-4 lg:p-6 !pb-0">
        <CardTitle className="text-2xl font-heading text-medical-900 flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Pediatric Dose Calculator
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          Select a dosing method and calculate medication dosages based on patient parameters
        </p>
      </CardHeader>

      <CardContent className="p-4 lg:p-6">
        <Tabs value={selectedMethod} onValueChange={setSelectedMethod} className="w-full">

          {/* Method Selection Tabs */}
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-3 bg-medical-50/30 p-1">
              {doseMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <TabsTrigger
                    key={method.id}
                    value={method.id}
                    className="rounded-md border-2 border-transparent transition-colors duration-300 ease-in-out hover:bg-medical-50/80 data-[state=active]:border-medical-600 data-[state=active]:bg-white data-[state=active]:shadow-none"
                  >
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-medical-50 border-medical-200"
                      >
                        {method.description}
                      </Badge>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Method Info */}
            <div className="mt-4 p-4 bg-medical-50/20 rounded-lg border border-medical-100/50">
              {doseMethods.map((method) => (
                selectedMethod === method.id && (
                  <div key={method.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <method.icon className="h-5 w-5 text-medical-600" />
                      <h3 className="font-semibold text-medical-900">{method.name} Dosing</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{method.details}</p>
                    <Badge variant="secondary" className="bg-medical-100 text-medical-800">
                      {method.note}
                    </Badge>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Method Forms */}
          <TabsContent value="weight" className="mt-0">
            <WeightBasedDoseForm />
          </TabsContent>

          <TabsContent value="bsa" className="mt-0">
            <BSABasedDoseForm />
          </TabsContent>

          <TabsContent value="bsa_normalized" className="mt-0">
            <BSANormalizedDoseForm />
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}