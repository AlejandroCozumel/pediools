// app/api/upgrade-to-premium/route.ts
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { NextRequest, NextResponse } from "next/server";
import { Feature, PlanType, SubscriptionStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body to get the specific doctor ID
    const body = await req.json();
    const { doctorId } = body;

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 });
    }

    // Verify the doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, clerkUserId: true }
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: { doctorId: doctor.id },
      update: {
        plan: PlanType.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        stripePriceId: "dummy_stripe_price_id",
        stripeSubscriptionId: `sub_${Math.random().toString(36).substr(2, 9)}`,
        stripeCustomerId: `cus_${Math.random().toString(36).substr(2, 9)}`,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      create: {
        doctorId: doctor.id,
        plan: PlanType.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        stripePriceId: "dummy_stripe_price_id",
        stripeSubscriptionId: `sub_${Math.random().toString(36).substr(2, 9)}`,
        stripeCustomerId: `cus_${Math.random().toString(36).substr(2, 9)}`,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    });

    // Add premium features
    await prisma.subscriptionFeature.createMany({
      data: Object.values(Feature).map(feature => ({
        subscriptionId: subscription.id,
        feature,
        enabled: true
      })),
      skipDuplicates: true
    });

    return NextResponse.json({
      message: "Successfully upgraded to premium",
      subscription
    }, { status: 200 });
  } catch (error) {
    console.error("Premium upgrade error:", error);
    return NextResponse.json({
      error: "Failed to upgrade to premium",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}