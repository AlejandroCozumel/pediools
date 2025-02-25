// app/api/dashboard/calculations/[patientId]/route.ts
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

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeCharts = searchParams.get('includeCharts') === 'true';
    const calculationType = searchParams.get('type') as CalculationType | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortOrder = searchParams.get('sortOrder') || 'asc'; // Default to ascending (older first)

    // Build the where clause
    const whereClause: any = {
      doctorId: doctor.id,
      patientId: params.patientId
    };

    // Add type filter if specified
    if (calculationType) {
      whereClause.type = calculationType;
    }

    // Add date range filter if specified
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    // Get total count for pagination
    const totalCalculations = await prisma.calculation.count({
      where: whereClause
    });

    // Get paginated calculations, ordered by date (older first by default)
    const calculations = await prisma.calculation.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            email: true,
            guardianEmail: true,
          },
        },
        charts: includeCharts, // Only include charts if explicitly requested
      },
      orderBy: { date: sortOrder === 'asc' ? 'asc' : 'desc' }, // Order by date, older first is 'asc'
      skip: (page - 1) * limit,
      take: limit,
    });

    // For comparing trends, we need to get previous calculations for each calculation
    const calculationsWithTrends = await Promise.all(
      calculations.map(async (calc) => {
        // Find previous calculation of same type
        const prevCalc = await prisma.calculation.findFirst({
          where: {
            doctorId: doctor.id,
            patientId: params.patientId,
            type: calc.type,
            date: { lt: calc.date }, // Get calculation before the current one
          },
          orderBy: { date: 'desc' }, // Get the most recent one before the current
          take: 1,
        });

        // Calculate trends if possible
        let trends = null;
        if (prevCalc) {
          trends = {
            weight: calculateTrend(calc.results, prevCalc.results, 'weight'),
            height: calculateTrend(calc.results, prevCalc.results, 'height')
          };
        }

        return {
          ...calc,
          trends
        };
      })
    );

    // Group by type while preserving pagination info
    const groupedCalculations = calculationsWithTrends.reduce((acc, calc) => {
      if (!acc[calc.type]) acc[calc.type] = [];
      (acc[calc.type] as typeof calculations).push(calc);
      return acc;
    }, {} as { [K in CalculationType]: typeof calculations });

    return NextResponse.json({
      calculations: groupedCalculations,
      pagination: {
        totalCalculations,
        totalPages: Math.ceil(totalCalculations / limit),
        currentPage: page,
        calculationsPerPage: limit
      }
    });
  } catch (error) {
    console.error("[PATIENT_CALCULATIONS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Helper to calculate trend
function calculateTrend(current: any, previous: any, field: string): string | null {
  // Safety checks
  if (!current || !previous) return null;
  if (!current[field]?.value || !previous[field]?.value) return null;

  // Calculate percentage change
  const currentValue = current[field].value;
  const previousValue = previous[field].value;
  const change = currentValue - previousValue;
  const percentChange = (change / previousValue) * 100;

  // Format with direction indicator and 1 decimal place
  return change >= 0
    ? `↑${percentChange.toFixed(1)}%`
    : `↓${Math.abs(percentChange).toFixed(1)}%`;
}

export async function PUT(
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

    const { calculationId, notes } = await request.json();

    if (!calculationId) {
      return NextResponse.json(
        { error: "Calculation ID is required" },
        { status: 400 }
      );
    }

    // Update the calculation notes
    const updatedCalculation = await prisma.calculation.updateMany({
      where: {
        id: calculationId,
        patientId: params.patientId,
        doctorId: doctor.id,
      },
      data: {
        notes,
      },
    });

    if (updatedCalculation.count === 0) {
      return NextResponse.json(
        { error: "Calculation not found or you don't have permission to edit it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATIENT_CALCULATION_UPDATE]", error);
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

    // Parse the request to handle both single and batch deletes
    const { searchParams } = new URL(request.url);
    const calculationId = searchParams.get("calculationId");
    const requestBody = request.body ? await request.json() : null;
    const calculationIds = requestBody?.calculationIds || [];

    // If a single calculationId is provided in query param, add it to the array
    if (calculationId && !calculationIds.includes(calculationId)) {
      calculationIds.push(calculationId);
    }

    if (calculationIds.length === 0) {
      return NextResponse.json(
        { error: "At least one calculation ID is required" },
        { status: 400 }
      );
    }

    // First, delete associated charts
    await prisma.chart.deleteMany({
      where: {
        calculationId: { in: calculationIds },
        patientId: params.patientId
      },
    });

    // Then delete the calculations
    const deleteResult = await prisma.calculation.deleteMany({
      where: {
        id: { in: calculationIds },
        patientId: params.patientId,
        doctorId: doctor.id,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count
    });
  } catch (error) {
    console.error("[PATIENT_CALCULATION_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}