// app/api/dashboard/patients/search/route.ts
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { search } = body;

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true
      }
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    const patients = await prisma.patient.findMany({
      where: {
        doctorId: doctor.id,
        OR: [
          { firstName: { contains: search || '', mode: 'insensitive' } },
          { lastName: { contains: search || '', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
      },
      take: 10,
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("[PATIENT_SEARCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}