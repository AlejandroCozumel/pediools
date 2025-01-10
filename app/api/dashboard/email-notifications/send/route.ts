// app/api/dashboard/email-notifications/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { Resend } from "resend";
import prisma from "@/lib/prismadb";
import { generateGrowthChartPDF } from "@/lib/generatePDF";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import { EmailType, EmailStatus } from "@prisma/client";

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
    } = await request.json();

    // Validate chart images
    if (!chartImages || chartImages.length === 0) {
      return NextResponse.json(
        { error: "No chart images provided" },
        { status: 400 }
      );
    }

    // Get doctor details (needed for both cases)
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      include: { profile: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // If patientId exists, verify patient exists
    if (patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }

      // Verify calculation exists if calculationId is provided
      if (chartData.calculationId) {
        const calculation = await prisma.calculation.findUnique({
          where: { id: chartData.calculationId },
        });

        if (!calculation) {
          return NextResponse.json(
            { error: "Calculation not found" },
            { status: 404 }
          );
        }
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

    // Generate PDF for both cases
    let pdfBlob;
    try {
      pdfBlob = await generateGrowthChartPDF(
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
    } catch (error) {
      console.error("PDF Generation failed:", error);
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 }
      );
    }

    // Upload PDF to Google Cloud Storage
    let pdfUrl;
    try {
      const timestamp = new Date().toISOString().split("T")[0];
      // Different paths for patient vs anonymous charts
      const fileName = patientId
        ? `doctors/${
            doctor.id
          }/patients/${patientId}/growth-charts/${timestamp}_${uuidv4()}.pdf`
        : `doctors/${doctor.id}/anonymous/${timestamp}_${uuidv4()}.pdf`;

      const bucket = storage.bucket(bucketName);
      const file = bucket.file(fileName);

      const arrayBuffer = await pdfBlob.arrayBuffer();
      await file.save(Buffer.from(arrayBuffer), {
        contentType: "application/pdf",
      });

      pdfUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    } catch (error) {
      console.error("File upload failed:", error);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Send email in both cases
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: recipientEmail,
        subject: emailSubject,
        html: `
          <p>Dear Patient/Guardian,</p>
          <p>${additionalMessage || ""}</p>
          <p>You can download your growth chart report using the following link:</p>
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

    // Only create database records if patientId exists
    if (patientId) {
      try {
        // Use transaction for database operations
        const [chart, emailNotification] = await prisma.$transaction(
          async (tx) => {
            // Find the existing chart
            const existingChart = await tx.chart.findFirst({
              where: {
                patientId: patientId,
                calculationId: chartData.calculationId,
                type: "GROWTH_CDC",
              },
              orderBy: {
                createdAt: "desc",
              },
            });

            if (existingChart) {
              // Update the existing chart
              const updatedChart = await tx.chart.update({
                where: {
                  id: existingChart.id,
                },
                data: {
                  pdfUrl: pdfUrl,
                },
              });

              const newEmailNotification = await tx.emailNotification.create({
                data: {
                  type: EmailType.CALCULATION_RESULTS,
                  status: EmailStatus.SENT,
                  pdfUrl,
                  emailSubject,
                  deliveryAttempts: 1,
                  patient: { connect: { id: patientId } },
                  doctor: { connect: { id: doctor.id } },
                  chart: { connect: { id: updatedChart.id } },
                },
              });

              return [updatedChart, newEmailNotification];
            } else {
              // If no existing chart is found, create a new one
              const newChart = await tx.chart.create({
                data: {
                  type: "GROWTH_CDC",
                  pdfUrl,
                  patient: { connect: { id: patientId } },
                  ...(chartData.calculationId && {
                    calculation: { connect: { id: chartData.calculationId } },
                  }),
                },
              });

              const newEmailNotification = await tx.emailNotification.create({
                data: {
                  type: EmailType.CALCULATION_RESULTS,
                  status: EmailStatus.SENT,
                  pdfUrl,
                  emailSubject,
                  deliveryAttempts: 1,
                  patient: { connect: { id: patientId } },
                  doctor: { connect: { id: doctor.id } },
                  chart: { connect: { id: newChart.id } },
                },
              });

              return [newChart, newEmailNotification];
            }
          }
        );

        return NextResponse.json({
          success: true,
          data: {
            emailId: emailNotification.id,
            chartId: chart.id,
            pdfUrl,
          },
        });
      } catch (error) {
        console.error("Database operation failed:", error);
        return NextResponse.json(
          { error: "Failed to save records" },
          { status: 500 }
        );
      }
    }

    // Return simplified response when no patient
    return NextResponse.json({
      success: true,
      data: {
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
