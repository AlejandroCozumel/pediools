// app/actions/subscription.ts
'use server';
import prisma from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";

export async function getSubscriptionByUserId() {
  try {
    // Get user from auth context
    const user = await currentUser();

    if (!user) {
      return {
        success: false,
        error: "Not authenticated"
      };
    }

    // Find the doctor
    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: user.id },
      include: { subscription: true },
    });

    if (!doctor) {
      return {
        success: false,
        error: "Doctor not found"
      };
    }

    if (!doctor.subscription) {
      // No subscription - determine if we should return FREE or null
      // Check if doctor has completed onboarding
      const hasCompletedOnboarding = Boolean(doctor.email && doctor.name);

      if (hasCompletedOnboarding) {
        // Initialized user with no paid plan gets FREE
        return {
          success: true,
          subscription: {
            status: "ACTIVE",
            plan: "FREE",
            staffCount: 0,
            currentPeriodEnd: null
          }
        };
      } else {
        // Uninitialized user gets null
        return {
          success: false,
          error: "No subscription found"
        };
      }
    }

    // Return full subscription details
    return {
      success: true,
      subscription: {
        status: doctor.subscription.status,
        plan: doctor.subscription.plan,
        staffCount: doctor.subscription.staffCount || 0,
        currentPeriodEnd: doctor.subscription.currentPeriodEnd
      }
    };
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}