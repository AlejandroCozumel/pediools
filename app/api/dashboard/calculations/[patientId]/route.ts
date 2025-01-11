import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { CalculationType } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });
    if (!doctor)
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const calculations = await prisma.calculation.findMany({
      where: { doctorId: doctor.id, patientId: params.patientId },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            email: true, // Add email field
            guardianEmail: true, // Add guardianEmail field
          },
        },
        charts: true,
      },
      orderBy: { date: "desc" },
    });

    const groupedCalculations = calculations.reduce((acc, calc) => {
      if (!acc[calc.type]) acc[calc.type] = [];
      (acc[calc.type] as typeof calculations).push(calc);
      return acc;
    }, {} as { [K in CalculationType]: typeof calculations });

    return NextResponse.json(groupedCalculations);
  } catch (error) {
    console.error("[PATIENT_CALCULATIONS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });
    if (!doctor)
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const calculationId = searchParams.get("calculationId");

    if (!calculationId) {
      return NextResponse.json(
        { error: "Calculation ID is required" },
        { status: 400 }
      );
    }

    // First, delete associated charts
    await prisma.chart.deleteMany({
      where: { calculationId },
    });

    // Then delete the calculation
    await prisma.calculation.deleteMany({
      where: {
        id: calculationId,
        patientId: params.patientId,
        doctorId: doctor.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATIENT_CALCULATION_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
