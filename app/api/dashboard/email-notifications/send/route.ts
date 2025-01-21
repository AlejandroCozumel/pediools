// app/api/dashboard/email-notifications/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { Resend } from "resend";
import prisma from "@/lib/prismadb";
import { generateGrowthChartPDF } from "@/lib/generatePDF";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import { EmailType, EmailStatus, Prisma } from "@prisma/client";

if (
  !process.env.GOOGLE_PROJECT_ID ||
  !process.env.GOOGLE_CLIENT_EMAIL ||
  !process.env.GOOGLE_PRIVATE_KEY
) {
  throw new Error("Missing Google Cloud credentials in environment variables");
}

const storage = new Storage({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
  },
});

const bucketName = "pedimath-pdfs";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      chartData,
      chartImages,
      patientId,
      recipientEmail,
      emailSubject,
      additionalMessage,
      preview,
      type,
    } = await request.json();

    // Validate chart images
    if (!chartImages || chartImages.length === 0) {
      return NextResponse.json(
        { error: "No chart images provided" },
        { status: 400 }
      );
    }

    // Get doctor details
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      include: { profile: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    let patient;
    if (patientId) {
      patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }
    }

    let calculation;
    if (chartData.calculationId) {
      calculation = await prisma.calculation.findUnique({
        where: { id: chartData.calculationId },
      });

      if (!calculation) {
        return NextResponse.json(
          { error: "Calculation not found" },
          { status: 404 }
        );
      }
    }

    // Prepare profile details for PDF
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

    // Check for existing chart record
    let chart;
    if (patientId && chartData.calculationId) {
      chart = await prisma.chart.findFirst({
        where: {
          patientId,
          calculationId: chartData.calculationId,
          type: type,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Check if PDF URL exists
    let pdfUrl = chart?.pdfUrl;

    if (!pdfUrl) {
      // Generate PDF if URL doesn't exist
      try {
        const pdfBlob = await generateGrowthChartPDF(
          chartData,
          profileDetails,
          {
            ...chartData.patientDetails,
            dateOfBirth: chartData.originalInput?.weight?.dateOfBirth
              ? new Date(chartData.originalInput.weight.dateOfBirth)
              : undefined,
            gender: chartData.originalInput?.weight?.gender,
          },
          chartImages
        );

        const timestamp = new Date().toISOString().split("T")[0];
        const fileName = patientId
          ? `doctors/${
              doctor.id
            }/patients/${patientId}/growth-charts/${timestamp}_${uuidv4()}.pdf`
          : `doctors/${doctor.id}/anonymous/${timestamp}_${uuidv4()}.pdf`;

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        await file.save(Buffer.from(await pdfBlob.arrayBuffer()), {
          contentType: "application/pdf",
        });

        pdfUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

        // First, check if patientId AND calculationId exist, since both are needed for chart
        if (patientId && calculation?.id) {
          // Try to find existing chart first
          const existingChart = await prisma.chart.findFirst({
            where: {
              patientId,
              calculationId: calculation.id,
              type: type,
            },
          });

          if (existingChart) {
            // Update existing chart with new PDF URL
            chart = await prisma.chart.update({
              where: { id: existingChart.id },
              data: { pdfUrl },
            });
          } else {
            // Create new chart only if we have both required fields
            chart = await prisma.chart.create({
              data: {
                type: type,
                pdfUrl,
                patient: { connect: { id: patientId } },
                calculation: { connect: { id: calculation.id } },
              },
            });
          }
        }
      } catch (error) {
        console.error("PDF Generation/Upload failed:", error);
        return NextResponse.json(
          { error: "Failed to generate or upload PDF" },
          { status: 500 }
        );
      }
    }

    if (preview) {
      return NextResponse.json({
        success: true,
        data: { pdfUrl },
      });
    }

    // Send email
    try {
      await resend.emails.send({
        from: "care@pedimath.com",
        to: recipientEmail,
        subject: emailSubject,
        html: `
          <p>Dear Patient/Guardian,</p>
          <p>${additionalMessage || ""}</p>
          <p>You can download your report using the following link:</p>
          <p><a href="${pdfUrl}">Download Report</a></p>
          <p>Best regards,<br/>Dr. ${doctor.name} ${doctor.lastName || ""}</p>
        `,
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Create email notification record
    let emailNotification;
    if (chart) {
      const notificationData: Prisma.EmailNotificationCreateInput = {
        type: EmailType.CALCULATION_RESULTS,
        status: EmailStatus.SENT,
        pdfUrl,
        emailSubject,
        deliveryAttempts: 1,
        doctor: { connect: { id: doctor.id } },
        chart: { connect: { id: chart.id } },
        recipientEmail,
      };

      if (patient) {
        notificationData.patient = { connect: { id: patient.id } };
      }

      emailNotification = await prisma.emailNotification.create({
        data: notificationData,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        chartId: chart?.id,
        emailId: emailNotification?.id,
        pdfUrl,
      },
    });
  } catch (error) {
    console.error("[EMAIL_NOTIFICATION]", error);
    return NextResponse.json(
      {
        error: "Failed to send email notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
