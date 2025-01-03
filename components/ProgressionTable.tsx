"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProgressionData {
  date: string;
  age: string;
  weight: string;
  height: string;
  bmi: string;
}

interface ProgressionTableProps {
  progressionData: ProgressionData[];
}

const ProgressionTable: React.FC<ProgressionTableProps> = ({
  progressionData,
}) => {
  if (!progressionData || progressionData.length === 0) {
    return null;
  }

  return (
    <Card className="border-medical-100">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="p-4 lg:p-6 lg:py-4 hover:no-underline">
            <h3 className="text-base md:text-lg
             lg:text-xl font-heading text-medical-900">
              Patient Progression
            </h3>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <div className="p-4 pt-0 lg:p-6 lg:pt-0">
              <Table>
                <TableCaption className="text-medical-600">
                  Historical measurements of patient growth
                </TableCaption>
                <TableHeader>
                  <TableRow className="bg-medical-50 hover:bg-medical-100">
                    <TableHead className="text-medical-700">Date</TableHead>
                    <TableHead className="text-medical-700">
                      Age (years)
                    </TableHead>
                    <TableHead className="text-medical-700">
                      Weight (kg)
                    </TableHead>
                    <TableHead className="text-medical-700">
                      Height (cm)
                    </TableHead>
                    <TableHead className="text-medical-700">BMI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progressionData.map((entry, index) => (
                    <TableRow key={index} className="hover:bg-medical-50">
                      <TableCell className="text-medical-800">
                        {format(new Date(entry.date), "PP")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-medical-200 text-medical-700"
                        >
                          {entry.age}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-medical-800">
                        {entry.weight}
                      </TableCell>
                      <TableCell className="text-medical-800">
                        {entry.height}
                      </TableCell>
                      <TableCell className="text-medical-800">
                        {entry.bmi}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default ProgressionTable;
