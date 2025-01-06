// app/api/create-checkout-session/route.ts
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { SubscriptionStatus, PlanType } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { priceId } = body;

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, clerkUserId: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const existingSubscription = await prisma.subscription.findUnique({
      where: { doctorId: doctor.id },
      select: { stripeCustomerId: true },
    });

    let stripeCustomerId = existingSubscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: { doctorId: doctor.id },
      });
      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.get(
        "origin"
      )}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/subscribe`,
      metadata: { doctorId: doctor.id },
    });

    // Create minimal initial subscription record
    await prisma.subscription.upsert({
      where: { doctorId: doctor.id },
      update: {
        stripeCustomerId,
        status: SubscriptionStatus.TRIALING,
        plan: PlanType.FREE,
        stripePriceId: priceId, // Add this
        stripeSubscriptionId: "", // Temporary placeholder
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      create: {
        doctorId: doctor.id,
        stripeCustomerId,
        status: SubscriptionStatus.TRIALING,
        plan: PlanType.FREE,
        stripePriceId: priceId,
        stripeSubscriptionId: "", // Temporary placeholder
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
