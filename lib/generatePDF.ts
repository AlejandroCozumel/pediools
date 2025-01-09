// lib/generatePDF.ts
import { jsPDF } from 'jspdf';
import { DoctorProfile, Patient } from '@prisma/client';

interface ProgressionRow {
  date: string;
  age: string | number;
  weight: string | number;
  height: string | number;
  bmi: string | number;
}

interface ChartData {
  progressionData?: ProgressionRow[];
  [key: string]: any;
}

export async function generateGrowthChartPDF(
  data: ChartData,
  profile?: DoctorProfile | null,
  patient?: Patient | null,
  chartImages?: string[]
) {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Add header with branding if available
  let yPos = 20;
  if (profile?.logoUrl) {
    pdf.addImage(profile.logoUrl, 'PNG', 10, 10, 30, 30);
    yPos = 50;
  }

  // Add clinic info
  if (profile) {
    pdf.setFontSize(16);
    pdf.text(profile.clinicName || '', 20, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    const clinicInfo = [
      profile.address || '',
      `${profile.city || ''}, ${profile.state || ''} ${profile.postalCode || ''}`,
      profile.phoneNumber || '',
    ].filter((item): item is string => item !== '' && item !== ', ');

    if (clinicInfo.length > 0) {
      pdf.text(clinicInfo, 20, yPos);
    }
    yPos += 20;
  }

  // Add patient info if available
  if (patient) {
    pdf.setFontSize(14);
    pdf.text('Patient Information', 20, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    const patientInfo = [
      `Name: ${patient.firstName} ${patient.lastName}`,
      `Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`,
      `Gender: ${patient.gender.toLowerCase()}`,
    ];

    pdf.text(patientInfo, 20, yPos);
    yPos += 20;
  }

  // Add report title and date
  pdf.setFontSize(16);
  pdf.text('Growth Chart Report', 20, yPos);
  yPos += 10;

  pdf.setFontSize(10);
  pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, yPos);
  yPos += 15;

  // Add progression table
  if (data.progressionData && data.progressionData.length > 0) {
    pdf.setFontSize(14);
    pdf.text('Growth Progression', 20, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    const headers = ['Date', 'Age', 'Weight (kg)', 'Height (cm)', 'BMI'];
    const columnWidths = [30, 25, 30, 30, 25];
    let xPos = 20;

    headers.forEach((header, i) => {
      pdf.text(header, xPos, yPos);
      xPos += columnWidths[i];
    });

    yPos += 5;

    data.progressionData.forEach((row: ProgressionRow) => {
      xPos = 20;
      pdf.text(new Date(row.date).toLocaleDateString(), xPos, yPos);
      xPos += columnWidths[0];
      pdf.text(row.age.toString(), xPos, yPos);
      xPos += columnWidths[1];
      pdf.text(row.weight.toString(), xPos, yPos);
      xPos += columnWidths[2];
      pdf.text(row.height.toString(), xPos, yPos);
      xPos += columnWidths[3];
      pdf.text(row.bmi.toString(), xPos, yPos);
      yPos += 7;
    });

    yPos += 10;
  }

  // Add charts from provided images
  if (chartImages && chartImages.length > 0) {
    for (const imgData of chartImages) {
      // Check if we need a new page
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.addImage(imgData, 'PNG', 20, yPos, 170, 100);
      yPos += 120; // chartSpacing
    }
  }

  // Add footer if available
  if (profile?.footerText) {
    pdf.setFontSize(8);
    pdf.text(profile.footerText, 20, 287);
  }

  return pdf.output('blob');
}