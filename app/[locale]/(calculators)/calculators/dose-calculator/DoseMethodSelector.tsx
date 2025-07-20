"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calculator, Weight, Activity, Maximize } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WeightBasedDoseForm } from "./WeightBasedDoseForm";
import { BSABasedDoseForm } from "./BSABasedDoseForm";
import { BSANormalizedDoseForm } from "./BSANormalizedDoseForm";
import { useTranslations } from 'next-intl';

export function DoseMethodSelector() {
  const t = useTranslations('DoseCalculator');
  const [selectedMethod, setSelectedMethod] = useState("weight");

  const doseMethods = [
    {
      id: "weight",
      name: t('methods.weight.name'),
      description: t('methods.weight.description'),
      icon: Weight,
      details: t('methods.weight.details'),
      note: ''
    },
    {
      id: "bsa",
      name: t('methods.bsa.name'),
      description: t('methods.bsa.description'),
      icon: Activity,
      details: t('methods.bsa.details'),
      note: ''
    },
    {
      id: "bsa_normalized",
      name: t('methods.bsa_normalized.name'),
      description: t('methods.bsa_normalized.description'),
      icon: Maximize,
      details: t('methods.bsa_normalized.details'),
      note: ''
    }
  ];

  return (
    <Card className="w-full mx-auto max-w-6xl">
      <CardHeader className="p-4 lg:p-6 !pb-0">
        <CardTitle className="text-2xl font-heading text-medical-900 flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
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
                    <div className="flex flex-col md:flex-col items-center gap-1 py-2 w-full">
                      <div className="flex justify-center md:justify-center w-full">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex justify-center md:justify-center w-full">
                        <span className="font-medium text-xs md:text-sm">{method.name}</span>
                      </div>
                      <div className="flex justify-center md:justify-center w-full">
                        <Badge
                          variant="outline"
                          className="text-[10px] md:text-xs bg-medical-50 border-medical-200"
                        >
                          {method.description}
                        </Badge>
                      </div>
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
                    {method.note && (
                      <Badge variant="secondary" className="bg-medical-100 text-medical-800">
                        {method.note}
                      </Badge>
                    )}
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