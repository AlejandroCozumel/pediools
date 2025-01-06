// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prismadb";
import { SubscriptionStatus, PlanType, Feature } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
      break;

    case "customer.subscription.updated":
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;

    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancelled(deletedSubscription);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const doctorId = session.metadata?.doctorId as string;
  const subscriptionId = session.subscription as string;

  if (!doctorId) {
    console.error("No doctor ID in checkout session metadata");
    return;
  }

  await prisma.subscription.update({
    where: { doctorId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      plan: PlanType.PREMIUM,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: session.line_items?.data[0].price?.id,
      currentPeriodStart: new Date(session.created * 1000),
      currentPeriodEnd: new Date(session.expires_at * 1000),
    },
  });

  // Optional: Add all premium features
  await prisma.subscriptionFeature.createMany({
    data: Object.values(Feature).map((feature) => ({
      subscriptionId: doctorId,
      feature,
      enabled: true,
    })),
    skipDuplicates: true,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const doctorId = subscription.metadata?.doctorId as string;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: mapStripeStatusToPrisma(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const gracePeriodEnd = new Date(
    currentPeriodEnd.getTime() + 14 * 24 * 60 * 60 * 1000
  ); // Add 14 days
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
      plan: PlanType.FREE,
      gracePeriodEnd: gracePeriodEnd,
    },
  });
}

function mapStripeStatusToPrisma(status: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    unpaid: SubscriptionStatus.UNPAID,
    trialing: SubscriptionStatus.TRIALING,
  };

  return statusMap[status] || SubscriptionStatus.UNPAID;
}
