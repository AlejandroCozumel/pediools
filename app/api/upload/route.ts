import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Initialize S3 client with KMS encryption
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const KMS_KEY_ARN = process.env.AWS_KMS_KEY_ARN!; // Add this to your .env

export async function POST(request: Request): Promise<Response> {
  try {
    const { base64Content, fileName, fileType, patientId } = await request.json();

    // Enhanced validation
    if (!base64Content || !fileName || !fileType || !patientId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(base64Content, "base64");

    // More structured key with patient context
    const key = `patients/${patientId}/${uuidv4()}-${fileName}`;

    // Upload to S3 with enhanced security
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: fileType,
      ServerSideEncryption: "aws:kms", // Use KMS instead of AES256
      SSEKMSKeyId: KMS_KEY_ARN, // Specify the KMS key
      Metadata: {
        'x-amz-meta-uploaded-by': 'system',
        'x-amz-meta-original-name': fileName,
        'x-amz-meta-patient-id': patientId,
        'x-amz-meta-upload-timestamp': new Date().toISOString()
      }
    });

    await s3Client.send(command);

    // Generate a secure, temporary URL if needed
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      message: "File uploaded successfully",
      key: key
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Server error occurred during file upload" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const { key, patientId } = await request.json();

    if (!key || !patientId) {
      return NextResponse.json(
        { error: "Missing required key or patient ID" },
        { status: 400 }
      );
    }

    // Verify the deletion request matches the patient context
    if (!key.startsWith(`patients/${patientId}/`)) {
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
      key: key
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Server error occurred during file deletion" },
      { status: 500 }
    );
  }
}