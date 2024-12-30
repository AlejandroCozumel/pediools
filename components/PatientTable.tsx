import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const PatientTable = () => {
  // Dummy data for demonstration
  const rows = [
    { date: "2024-01-15", age: "10", weight: "32", height: "142", bmi: "15.8" },
    {
      date: "2024-02-15",
      age: "10.1",
      weight: "33",
      height: "143",
      bmi: "16.1",
    },
    {
      date: "2024-03-15",
      age: "10.2",
      weight: "33.5",
      height: "144",
      bmi: "16.2",
    },
    {
      date: "2024-04-15",
      age: "10.3",
      weight: "34",
      height: "145",
      bmi: "16.2",
    },
    {
      date: "2024-05-15",
      age: "10.4",
      weight: "34.5",
      height: "146",
      bmi: "16.2",
    },
    {
      date: "2024-06-15",
      age: "10.5",
      weight: "35",
      height: "147",
      bmi: "16.2",
    },
    {
      date: "2024-07-15",
      age: "10.6",
      weight: "35.5",
      height: "148",
      bmi: "16.2",
    },
  ];

  return (
    <Card className="w-full mx-auto bg-medical-10 border-medical-200 mb-4">
      <CardHeader className="px-4 py-4 border-b border-medical-100">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex items-center gap-2 text-xs md:text-sm ">
            <span className="font-medium text-medical-700 whitespace-nowrap">
              Mother's Height:
            </span>
            <span>180cm</span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm ">
            <span className="font-medium text-medical-700 whitespace-nowrap">
              Father's Height:
            </span>
            <span>190cm</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border border-medical-100">
          <Table>
            <TableHeader className="bg-medical-50">
              <TableRow>
                <TableHead className="w-[150px] text-medical-700">
                  Date
                </TableHead>
                <TableHead className="text-medical-900">Age</TableHead>
                <TableHead className="text-medical-900">Weight (kg)</TableHead>
                <TableHead className="text-medical-900">Height (cm)</TableHead>
                <TableHead className="text-medical-900">BMI*</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={idx}
                  className="hover:bg-medical-50 transition-colors"
                >
                  <TableCell className="font-medium text-medical-600">
                    {row.date}
                  </TableCell>
                  <TableCell className="text-medical-600">{row.age}</TableCell>
                  <TableCell className="text-medical-600">
                    {row.weight}
                  </TableCell>
                  <TableCell className="text-medical-600">
                    {row.height}
                  </TableCell>
                  <TableCell className="text-medical-600">{row.bmi}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 text-xs text-medical-600">
          *BMI = Body Mass Index (kg/m²)
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientTable;
