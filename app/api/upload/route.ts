import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

// Initialize S3 client with KMS encryption
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const KMS_KEY_ARN = process.env.AWS_KMS_KEY_ARN!;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch doctor from Prisma using Clerk user ID
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    const { base64Content, fileName, fileType, patientId } =
      await request.json();

    // Validation to ensure required fields are present
    if (!base64Content || !fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(base64Content, "base64");

    // Generate key based on doctor and optional patient
    const key = patientId
      ? `doctors/${doctor.id}/patients/${patientId}/${uuidv4()}-${fileName}`
      : `doctors/${doctor.id}/documents/${uuidv4()}-${fileName}`;

    // Upload to S3 with enhanced security
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: fileType,
      ServerSideEncryption: "aws:kms",
      SSEKMSKeyId: KMS_KEY_ARN,
      Metadata: {
        "x-amz-meta-uploaded-by": "system",
        "x-amz-meta-original-name": fileName,
        "x-amz-meta-doctor-id": doctor.id,
        ...(patientId && { "x-amz-meta-patient-id": patientId }),
        "x-amz-meta-upload-timestamp": new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    return NextResponse.json({
      message: "File uploaded successfully",
      key: key,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Server error occurred during file upload" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch doctor from Prisma using Clerk user ID
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    const { key } = await request.json();

    // Validate key
    if (!key) {
      return NextResponse.json(
        { error: "Missing required file key" },
        { status: 400 }
      );
    }

    // Additional security: Verify the key belongs to the authenticated doctor
    if (!key.startsWith(`doctors/${doctor.id}/`)) {
      return NextResponse.json(
        { error: "Unauthorized file deletion" },
        { status: 403 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return NextResponse.json({
      message: "File deleted successfully",
      key: key,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Server error occurred during file deletion" },
      { status: 500 }
    );
  }
}
