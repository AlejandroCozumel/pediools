import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { getAuth } from "@clerk/nextjs/server";
import { CalculationType, ChartType } from "@prisma/client";

const getChartType = (calculatorType: string): ChartType => {
  switch (calculatorType) {
    case 'cdc_child':
      return ChartType.GROWTH_CDC;
    case 'cdc_infant':
      return ChartType.GROWTH_CDC;
    case 'who':
      return ChartType.GROWTH_WHO;
    case 'intergrowth':
      return ChartType.GROWTH_INTERGROWTH;
    default:
      throw new Error('Invalid calculator type');
  }
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the doctor
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const data = await req.json();
    const { patientId, calculatorType, measurement } = data;

    // Validate patient belongs to doctor
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        doctorId: doctor.id,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Create the calculation
    const calculation = await prisma.calculation.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        type: CalculationType.GROWTH_PERCENTILE,
        inputData: {
          weight: measurement.weight,
          height: measurement.height,
          headCircumference: measurement.headCircumference,
          standard: measurement.standard,
          // For WHO/CDC standards
          ...(measurement.birthDate && measurement.measurementDate
            ? {
                birthDate: measurement.birthDate,
                measurementDate: measurement.measurementDate,
              }
            : {}),
          // For Intergrowth
          ...(measurement.gestationalWeeks && measurement.gestationalDays
            ? {
                gestationalWeeks: measurement.gestationalWeeks,
                gestationalDays: measurement.gestationalDays,
              }
            : {}),
        },
        results: {}, // You can add calculated results here if needed
      },
    });

    const chartType = getChartType(calculatorType);

    // Check if the generated chartType is a valid ChartType enum value
    if (!Object.values(ChartType).includes(chartType as ChartType)) {
      return NextResponse.json(
        { error: "Invalid chart type" },
        { status: 400 }
      );
    }

    // Create associated chart
    const chart = await prisma.chart.create({
      data: {
        patientId: patient.id,
        calculationId: calculation.id,
        type: chartType as ChartType,
      },
    });

    return NextResponse.json({
      success: true,
      data: { calculation, chart },
    });
  } catch (error) {
    console.error("Error saving measurements:", error);
    return NextResponse.json(
      { error: "Error saving measurements" },
      { status: 500 }
    );
  }
}