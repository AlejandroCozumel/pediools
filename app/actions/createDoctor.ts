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

    // Check if doctor already exists to prevent duplicates
    const existingDoctor = await prisma.doctor.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (existingDoctor) {
      // Doctor already exists, check if they have a subscription
      await initializeSubscription(existingDoctor.id);
      return { success: true, doctor: existingDoctor };
    }

    // Find primary email
    const primaryEmail = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    )?.emailAddress || user.emailAddresses[0]?.emailAddress || "";

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
    console.error("Error creating doctor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}