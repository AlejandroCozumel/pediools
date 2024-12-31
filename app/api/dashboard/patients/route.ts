import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prismadb";

// Define types for better type safety
type PatientFromDB = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: "MALE" | "FEMALE";
};

type TransformedPatient = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
};

// Type for POST request body
type PatientCreateInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  email?: string;
  phoneNumber?: string;
  secondaryPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  bloodType?:
    | "A_POSITIVE"
    | "A_NEGATIVE"
    | "B_POSITIVE"
    | "B_NEGATIVE"
    | "O_POSITIVE"
    | "O_NEGATIVE"
    | "AB_POSITIVE"
    | "AB_NEGATIVE";
  allergies?: string;
  medications?: string;
  medicalNotes?: string;
  insuranceInfo?: string;
  emergencyContact?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?:
    | "MOTHER"
    | "FATHER"
    | "STEPMOTHER"
    | "STEPFATHER"
    | "GRANDMOTHER"
    | "GRANDFATHER"
    | "AUNT"
    | "UNCLE"
    | "SIBLING"
    | "LEGAL_GUARDIAN"
    | "FOSTER_PARENT"
    | "CAREGIVER"
    | "OTHER";
};

// GET all patients
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      include: {
        patients: {
          orderBy: {
            calculations: {
              _count: 'desc',
            }
          },
          include: {
            calculations: {
              orderBy: { date: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const formattedPatients = doctor.patients.map((patient) => ({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth.toISOString(),
      gender: patient.gender,
      lastCalculation: patient.calculations[0]?.date.toISOString() || null,
      lastVisit: patient.updatedAt.toISOString(),
      status: "Active", // Or implement your status logic
    }));

    return NextResponse.json(formattedPatients);
  } catch (error) {
    console.error("[PATIENTS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST create new patient
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    const body: PatientCreateInput = await req.json();
    const patient = await prisma.patient.create({
      data: {
        doctorId: doctor.id,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender,
        email: body.email,
        phoneNumber: body.phoneNumber,
        secondaryPhone: body.secondaryPhone,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country,
        bloodType: body.bloodType,
        allergies: body.allergies,
        medications: body.medications,
        medicalNotes: body.medicalNotes,
        insuranceInfo: body.insuranceInfo,
        emergencyContact: body.emergencyContact,
        guardianName: body.guardianName,
        guardianPhone: body.guardianPhone,
        guardianEmail: body.guardianEmail,
        guardianRelation: body.guardianRelation,
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("[PATIENT_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
