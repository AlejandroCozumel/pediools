// app/api/dashboard/pdf/preview/route.ts
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

    // Get doctor details for PDF header
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      include: {
        profile: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Generate PDF with the provided images
    const pdfBlob = await generateGrowthChartPDF(chartData, doctor.profile, null, chartImages);

    // Convert blob to array buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();

    // Create response with proper headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="growth-chart-preview.pdf"',
      },
    });

  } catch (error) {
    console.error("[PDF_PREVIEW]", error);
    return NextResponse.json(
      { error: "Failed to generate PDF preview" },
      { status: 500 }
    );
  }
}