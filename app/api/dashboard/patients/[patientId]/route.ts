import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { CalculationType } from "@prisma/client";

// GET calculations for a specific patient
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
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

    // Fetch calculations for the specific patient, ensuring the patient belongs to the doctor
    const calculations = await prisma.calculation.findMany({
      where: {
        patientId: params.patientId,
        doctorId: doctor.id
      },
      include: {
        charts: true // Include associated charts
      },
      orderBy: {
        date: 'desc' // Most recent calculations first
      },
      take: 50 // Limit to 50 most recent calculations
    });

    return NextResponse.json(calculations);
  } catch (error) {
    console.error("[CALCULATIONS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST create a new calculation
export async function POST(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
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

    // Validate patient belongs to doctor
    const patient = await prisma.patient.findFirst({
      where: {
        id: params.patientId,
        doctorId: doctor.id
      }
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();

    // Create calculation
    const calculation = await prisma.calculation.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        type: body.type || CalculationType.GROWTH_PERCENTILE,
        inputData: body.inputData || {},
        results: body.results || {},
      },
      include: {
        charts: true
      }
    });

    return NextResponse.json(calculation, { status: 201 });
  } catch (error) {
    console.error("[CALCULATIONS_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Optional: DELETE calculation by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
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

    // Parse calculation ID from request body
    const { calculationId } = await req.json();

    // Delete calculation, ensuring it belongs to the patient and doctor
    const deletedCalculation = await prisma.calculation.deleteMany({
      where: {
        id: calculationId,
        patientId: params.patientId,
        doctorId: doctor.id
      }
    });

    if (deletedCalculation.count === 0) {
      return NextResponse.json({ error: "Calculation not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CALCULATIONS_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}