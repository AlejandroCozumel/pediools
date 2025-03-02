import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prismadb";
import {
  startOfMonth,
  subMonths,
  endOfMonth,
  differenceInMonths,
} from "date-fns";

type Calculation = {
  date: Date;
  results: any;
  type: string;
};

type FamilyPatient = {
  id: string;
  firstName: string;
  lastName: string;
  guardianName?: string | null;
  guardianPhone?: string | null;
  address?: string | null;
};

// Helper functions for enhanced patient data
const determineGrowthAlert = (
  calculations: Calculation[] | undefined
): boolean => {
  // Look for concerning growth patterns in the recent calculations
  if (!calculations || calculations.length < 2) return false;

  // Example logic: Check if patient's percentile has decreased significantly
  const latest = getPercentileFromCalculation(calculations[0]);
  const previous = getPercentileFromCalculation(calculations[1]);

  if (latest !== null && previous !== null) {
    // Alert if percentile dropped by more than 15 points
    return previous - latest > 15;
  }

  return false;
};

const determineFollowUpAlert = (
  calculations: Calculation[] | undefined,
  lastVisit: Date | string | undefined
): boolean => {
  if (!calculations || calculations.length === 0) return false;
  if (!lastVisit) return false;

  const lastVisitDate = new Date(lastVisit);
  const today = new Date();

  // Alert if it's been more than 6 months since last visit AND
  // the latest calculation had a concerning status
  const monthsSinceLastVisit = differenceInMonths(today, lastVisitDate);
  const needsFollowUp = monthsSinceLastVisit > 6;

  const latestCalculation = calculations[0];
  const hasGrowthConcern =
    determineGrowthStatus(latestCalculation) === "concern";

  return needsFollowUp || hasGrowthConcern;
};

const getPercentileFromCalculation = (
  calculation: Calculation | undefined
): number | null => {
  if (!calculation || !calculation.results) return null;

  try {
    // Try different paths to find percentile in the calculation results
    // This depends on your actual data structure
    const results = calculation.results;

    if (results.percentile) return results.percentile;
    if (results.calculatedPercentile) return results.calculatedPercentile;

    // For weight/height specific percentiles
    if (results.weight?.percentiles?.calculatedPercentile) {
      return results.weight.percentiles.calculatedPercentile;
    }

    if (results.height?.percentiles?.calculatedPercentile) {
      return results.height.percentiles.calculatedPercentile;
    }

    return null;
  } catch (error) {
    console.error("Error extracting percentile:", error);
    return null;
  }
};

const determineGrowthStatus = (
  calculation: Calculation | undefined
): string | null => {
  if (!calculation) return null;

  const percentile = getPercentileFromCalculation(calculation);
  if (percentile === null) return null;

  // Define the thresholds for concern
  if (percentile < 3 || percentile > 97) {
    return "concern";
  } else if (percentile < 10 || percentile > 90) {
    return "monitor";
  } else {
    return "normal";
  }
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
            updatedAt: "desc", // Use updatedAt instead of lastVisit
          },
          include: {
            calculations: {
              orderBy: { date: "desc" },
              take: 5, // Get more calculations to evaluate growth trends
            },
            appointments: {
              where: {
                datetime: {
                  gte: new Date(), // Only upcoming appointments
                },
                status: "SCHEDULED", // Only include scheduled appointments
              },
              orderBy: {
                datetime: "asc",
              },
              take: 1, // Just get the next appointment
            },
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Process each patient to add the enhanced data
    const enhancedPatients = doctor.patients.map((patient) => {
      // Determine if there are any growth alerts
      const hasGrowthAlert = determineGrowthAlert(patient.calculations);

      // Determine if a follow-up is needed
      const needsFollowUp = determineFollowUpAlert(
        patient.calculations,
        patient.updatedAt
      );

      // Get upcoming appointment details
      const upcomingAppointment = patient.appointments[0] || null;

      // Get latest calculation metrics
      const latestCalculation = patient.calculations[0] || null;

      return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth.toISOString(),
        gender: patient.gender,
        lastCalculation: latestCalculation?.date.toISOString() || null,
        lastVisit: patient.updatedAt.toISOString(),
        status: "Active", // Or implement your status logic

        // Enhanced fields
        growthAlert: hasGrowthAlert,
        followUpAlert: needsFollowUp,

        appointmentStatus: upcomingAppointment
          ? {
              upcoming: true,
              date: upcomingAppointment.datetime.toISOString(),
              type: upcomingAppointment.type || "General",
              appointmentId: upcomingAppointment.id
            }
          : {
              upcoming: false,
            },

        calculationMetrics: latestCalculation
          ? {
              type: latestCalculation.type,
              percentile: getPercentileFromCalculation(latestCalculation),
              status: determineGrowthStatus(latestCalculation),
            }
          : null,
      };
    });

    // Calculate statistics
    const totalPatients = doctor.patients.length;
    const patientsWithCalculations = doctor.patients.filter(
      (patient) => patient.calculations.length > 0
    ).length;

    const newPatientsThisMonth = await prisma.patient.count({
      where: {
        doctorId: doctor.id,
        createdAt: {
          gte: startOfMonth(new Date()),
        },
      },
    });

    const newPatientsLastMonth = await prisma.patient.count({
      where: {
        doctorId: doctor.id,
        createdAt: {
          gte: startOfMonth(subMonths(new Date(), 1)),
          lte: endOfMonth(subMonths(new Date(), 1)),
        },
      },
    });

    // Count patients with alerts
    const patientsWithAlerts = enhancedPatients.filter(
      (p) => p.growthAlert || p.followUpAlert
    ).length;

    // Count patients with upcoming appointments
    const patientsWithAppointments = enhancedPatients.filter(
      (p) => p.appointmentStatus.upcoming
    ).length;

    return NextResponse.json({
      patients: enhancedPatients,
      totalPatients,
      patientsWithCalculations,
      newPatientsThisMonth,
      newPatientsLastMonth,
      patientsWithAlerts,
      patientsWithAppointments,
    });
  } catch (error: unknown) {
    console.error("[PATIENTS_GET]", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      {
        error: "Internal error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// POST create new patient (unchanged)
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

    const body = await req.json();
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
