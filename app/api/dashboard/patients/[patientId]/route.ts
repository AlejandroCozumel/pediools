import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { CalculationType } from "@prisma/client";

// GET calculations (with optional patient filter)
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    // Base query for calculations
    const calculationsQuery = {
      where: {
        doctorId: doctor.id,
        ...(patientId ? { patientId } : {}),
      },
      include: {
        charts: true,
        patient: true
      },
      orderBy: {
        date: "desc" as const,
      },
      take: 50,
    };

    const calculations = await prisma.calculation.findMany(calculationsQuery);

    // Add patient name to each calculation
    const calculationsWithFullPatient = calculations.map((calc) => ({
      ...calc,
      patient: calc.patient,
    }));


    return NextResponse.json(calculationsWithFullPatient);
  } catch (error) {
    console.error("[CALCULATIONS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST create a new calculation
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { patientId, ...calculationData } = body;

    // Validate patient belongs to doctor
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        calculations: {
          orderBy: { date: "desc" },
          take: 50,
          include: {
            charts: true,
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Create calculation
    const calculation = await prisma.calculation.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        type: calculationData.type || CalculationType.GROWTH_PERCENTILE,
        inputData: calculationData.inputData || {},
        results: calculationData.results || {},
      },
      include: {
        charts: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Add patient name to the new calculation
    const calculationWithPatientName = {
      ...calculation,
      patientName: `${calculation.patient.firstName} ${calculation.patient.lastName}`,
    };

    return NextResponse.json(calculationWithPatientName, { status: 201 });
  } catch (error) {
    console.error("[CALCULATIONS_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE a specific calculation
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Parse calculation ID from query parameters
    const { searchParams } = new URL(req.url);
    const calculationId = searchParams.get("calculationId");

    if (!calculationId) {
      return NextResponse.json(
        { error: "Calculation ID is required" },
        { status: 400 }
      );
    }

    // Delete calculation, ensuring it belongs to the doctor
    const deletedCalculation = await prisma.calculation.deleteMany({
      where: {
        id: calculationId,
        doctorId: doctor.id,
      },
    });

    if (deletedCalculation.count === 0) {
      return NextResponse.json(
        { error: "Calculation not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CALCULATIONS_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
