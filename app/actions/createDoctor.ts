'use server';
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { initializeSubscription } from "./initializeSubscription";

export async function createDoctor() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Find primary email
    const primaryEmail = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    )?.emailAddress || user.emailAddresses[0]?.emailAddress || "";

    // Check if doctor already exists by clerkUserId or email
    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        OR: [
          { clerkUserId: user.id },
          { email: primaryEmail },
        ],
      },
    });

    if (existingDoctor) {
      console.log("Doctor already exists in DB, skipping creation.");
      await initializeSubscription(existingDoctor.id);
      return { success: true, doctor: existingDoctor, message: "Doctor already exists" };
    }

    // Create doctor in database
    const doctor = await prisma.doctor.create({
      data: {
        clerkUserId: user.id,
        email: primaryEmail,
        name: user.firstName || "",
        lastName: user.lastName || "",
        profilePicture: user.imageUrl || "",
        defaultChartView: "FOCUSED",
      }
    });

    // Initialize with FREE subscription
    await initializeSubscription(doctor.id);

    return { success: true, doctor };
  } catch (error) {
    // If error is unique constraint, treat as already exists
    if (error instanceof Error && (error as any).code === 'P2002') {
      console.log("Doctor already exists (unique constraint error), treating as success.");
      return { success: true, message: "Doctor already exists (unique constraint error)" };
    }
    console.error("Error creating doctor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}