// app/api/dashboard/home/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { startOfMonth, subMonths } from "date-fns";

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

    // Prepare data similar to calculations dashboard
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const firstDayOfLastMonth = startOfMonth(subMonths(now, 1));

    const totalPatients = await prisma.patient.count({
      where: { doctorId: doctor.id },
    });

    const patientsWithCalculations = await prisma.calculation.findMany({
      where: { doctorId: doctor.id },
      distinct: ["patientId"],
      select: { patientId: true },
    });

    const newPatientsThisMonth = await prisma.patient.count({
      where: {
        doctorId: doctor.id,
        createdAt: { gte: firstDayOfMonth },
      },
    });

    const newPatientsLastMonth = await prisma.patient.count({
      where: {
        doctorId: doctor.id,
        createdAt: {
          gte: firstDayOfLastMonth,
          lt: firstDayOfMonth,
        },
      },
    });

    // Fetch recent patients and activities for DashboardStats
    const recentPatients = await prisma.patient.findMany({
      where: {
        doctorId: doctor.id,
        calculations: {
          some: {} // This ensures at least one calculation exists
        }
      },
      orderBy: [{
        calculations: {
          _count: "desc"  // Order by number of calculations
        }
      }, {
        createdAt: "desc" // Secondary sort by creation date
      }],
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        calculations: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    const recentCalculations = await prisma.calculation.findMany({
      where: { doctorId: doctor.id },
      orderBy: { date: "desc" },
      take: 5,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalPatients,
        uniquePatients: patientsWithCalculations.length,
        newPatientsThisMonth,
        newPatientsLastMonth,
      },
      recentPatients: recentPatients.map((patient) => ({
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        age: calculateAge(patient.dateOfBirth),
        gender: patient.gender,
        lastVisit: patient.calculations[0]?.date?.toISOString() || null,
        status: patient.calculations[0]
          ? "Growth Chart Updated"
          : "New Patient",
      })),
      recentCalculations: recentCalculations.map((calc) => ({
        id: calc.patient.id,
        type: calc.type,
        patient: `${calc.patient.firstName} ${calc.patient.lastName}`,
        date: calc.date.toISOString(),
        status: "Completed",
      })),
      // recentActivity: recentCalculations.map((calc) => ({
      //   type: calc.type,
      //   patient: `${calc.patient.firstName} ${calc.patient.lastName}`,
      //   date: calc.date.toISOString(),
      //   status: "Completed",
      // })),
    });
  } catch (error) {
    console.error("[DASHBOARD_HOME_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Utility function to calculate age
function calculateAge(dateOfBirth: Date): string {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }

  if (years > 0 && months > 0) {
    return `${years}y ${months}m`;
  } else if (years > 0) {
    return `${years}y`;
  } else {
    return `${months}m`;
  }
}
