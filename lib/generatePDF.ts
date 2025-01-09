import React from "react";
import { renderToBuffer, Document, Page } from "@react-pdf/renderer";
import PDFDocument from "./PDFDocument";

// Interfaces for type safety
interface ProgressionRow {
  date: string;
  age: string | number;
  weight: string | number;
  height: string | number;
  bmi: string | number;
}

interface ChartData {
  progressionData?: ProgressionRow[];
  originalInput?: {
    weight?: { gender?: "male" | "female" };
    height?: { gender?: "male" | "female" };
  };
  patientDetails?: PatientDetails;
  success?: boolean;
}

interface ProfileDetails {
  clinicName?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phoneNumber?: string;
  logoUrl?: string;
  footerText?: string;
}

interface PatientDetails {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date | string;
  gender?: string;
  name?: string;
}

export async function generateGrowthChartPDF(
  data?: ChartData,
  profile?: ProfileDetails,
  patient?: PatientDetails,
  chartImages?: string[]
): Promise<Blob> {
  try {
    // Create the element using React.createElement
    const element = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A4" },
        React.createElement(PDFDocument, {
          data: data || {},
          profile: profile || {},
          patient: patient || data?.patientDetails || {},
          chartImages: chartImages || [],
        })
      )
    );

    // Attempt to render to buffer with error catching
    const pdfBuffer = await renderToBuffer(element);

    return new Blob([pdfBuffer], { type: "application/pdf" });
  } catch (error) {
    console.error("PDF Generation Error:", error);

    // Log additional context about the error
    if (error instanceof Error) {
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
    }

    throw error;
  }
}
