// app/dashboard/patients/[patientId]/route.ts
import prisma from "@/lib/prismadb";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

// GET patient details
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.patientId;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        calculations: {
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            charts: true,
          }
        },
        appointments: {
          orderBy: { datetime: 'desc' },
          take: 5,
        },
        prescriptions: {
          orderBy: { issuedAt: 'desc' },
          take: 5,
        },
        medicalHistory: true,
        vaccinations: {
          orderBy: { administeredAt: 'desc' }
        },
        labResults: {
          orderBy: { testDate: 'desc' },
          take: 5
        },
        emailNotifications: {
          orderBy: { sentAt: 'desc' },
          take: 5,
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get total counts
    const [calculationsCount, emailsCount, chartsCount] = await Promise.all([
      prisma.calculation.count({
        where: { patientId }
      }),
      prisma.emailNotification.count({
        where: { patientId }
      }),
      prisma.chart.count({
        where: { patientId }
      })
    ]);

    const patientData = {
      ...patient,
      stats: {
        totalCalculations: calculationsCount,
        totalEmails: emailsCount,
        totalDocuments: chartsCount,
      }
    };

    return NextResponse.json(patientData);
  } catch (error) {
    console.error("[PATIENT_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH/PUT to update patient
export async function PATCH(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.patientId;
    const body = await request.json();

    // Remove any fields that shouldn't be updated directly
    const {
      id,
      createdAt,
      updatedAt,
      doctorId,
      ...updateData
    } = body;

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
      include: {
        calculations: {
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            charts: true,
          }
        },
        // ... include other relations as needed
      }
    });

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error("[PATIENT_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.patientId;

    // Optional: Check if patient belongs to the doctor
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Delete patient and all related records
    // Note: This assumes you have cascade delete set up in your schema
    const deletedPatient = await prisma.patient.delete({
      where: {
        id: patientId,
        doctorId: doctor.id, // Ensure patient belongs to doctor
      },
    });

    if (!deletedPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PATIENT_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}