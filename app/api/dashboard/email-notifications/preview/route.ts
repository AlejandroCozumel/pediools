import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { generateGrowthChartPDF } from "@/lib/generatePDF";

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chartData, chartImages } = await request.json();

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      include: {
        profile: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Prepare profile details
    const profileDetails = doctor.profile
      ? {
          clinicName: doctor.profile.clinicName || undefined,
          address: doctor.profile.address || undefined,
          city: doctor.profile.city || undefined,
          state: doctor.profile.state || undefined,
          postalCode: doctor.profile.postalCode || undefined,
          phoneNumber: doctor.profile.phoneNumber || undefined,
          logoUrl: doctor.profile.logoUrl || undefined,
          footerText: doctor.profile.footerText || undefined,
        }
      : {};

    // Use patient details from chartData
    const pdfBlob = await generateGrowthChartPDF(
      chartData,
      profileDetails,
      {
        ...chartData.patientDetails,
        dateOfBirth: chartData.originalInput?.weight?.dateOfBirth ? new Date(chartData.originalInput?.weight?.dateOfBirth) : undefined,
        gender: chartData.originalInput?.weight?.gender ? chartData.originalInput?.weight?.gender : undefined,
      },
      chartImages
    );

    const arrayBuffer = await pdfBlob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="growth-chart-preview.pdf"',
      },
    });
  } catch (error) {
    console.error("[PDF_PREVIEW]", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF preview",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
