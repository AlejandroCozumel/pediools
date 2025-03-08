'use server';

import prisma from "@/lib/prismadb";
import { PlanType, SubscriptionStatus, Feature } from "@prisma/client";

/**
 * Initialize a doctor's subscription to FREE plan after signup
 * This ensures they start with the correct default plan
 */
export async function initializeSubscription(doctorId: string) {
  try {
    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { doctorId },
    });

    // If subscription already exists, don't modify it
    if (existingSubscription) {
      return { success: true, subscription: existingSubscription };
    }

    // Create a new FREE subscription
    // Note: For FREE plans, we set minimal required fields and leave Stripe fields empty
    const subscription = await prisma.subscription.create({
      data: {
        doctorId,
        status: SubscriptionStatus.ACTIVE,
        plan: PlanType.FREE,
        currentPeriodStart: new Date(), // Just for record-keeping
        currentPeriodEnd: new Date(9999, 11, 31), // Far future date instead of null
        stripeCustomerId: "",
        stripePriceId: "",
        stripeSubscriptionId: "",
      },
    });

    // Create basic features for FREE plan
    await prisma.subscriptionFeature.createMany({
      data: [
        {
          subscriptionId: subscription.id,
          feature: Feature.GROWTH_CHARTS,
          enabled: true
        },
        {
          subscriptionId: subscription.id,
          feature: Feature.PATIENT_TRACKING,
          enabled: true
        },
        // All other features disabled for FREE plan
        {
          subscriptionId: subscription.id,
          feature: Feature.PDF_REPORTS,
          enabled: false
        },
        {
          subscriptionId: subscription.id,
          feature: Feature.EMAIL_REPORTS,
          enabled: false
        },
        {
          subscriptionId: subscription.id,
          feature: Feature.DATA_EXPORT,
          enabled: false
        },
        {
          subscriptionId: subscription.id,
          feature: Feature.CUSTOM_BRANDING,
          enabled: false
        },
        {
          subscriptionId: subscription.id,
          feature: Feature.STAFF_MANAGEMENT,
          enabled: false
        },
        {
          subscriptionId: subscription.id,
          feature: Feature.MULTI_LOCATION,
          enabled: false
        },
        {
          subscriptionId: subscription.id,
          feature: Feature.CUSTOM_INTEGRATIONS,
          enabled: false
        }
      ]
    });

    return { success: true, subscription };
  } catch (error) {
    console.error("Error initializing subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}