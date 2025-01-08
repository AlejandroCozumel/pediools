// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prismadb";
import { SubscriptionStatus, PlanType, Feature } from "@prisma/client";
import { sendEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
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

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(failedInvoice);
        break;

      case "invoice.payment_succeeded":
        const successfulInvoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(successfulInvoice);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  try {
    const doctorId = session.metadata?.doctorId as string;
    const subscriptionId = session.subscription as string;

    if (!doctorId) {
      console.error("No doctor ID in checkout session metadata");
      return;
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { doctorId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        plan: PlanType.PREMIUM,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: session.line_items?.data[0].price?.id,
        currentPeriodStart: new Date(session.created * 1000),
        currentPeriodEnd: new Date(session.expires_at * 1000),
      },
      select: {
        id: true,
      },
    });

    await prisma.subscriptionFeature.createMany({
      data: Object.values(Feature).map((feature) => ({
        subscriptionId: updatedSubscription.id,
        feature,
        enabled: true,
      })),
      skipDuplicates: true,
    });

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (doctor) {
      const periodEnd = new Date(session.expires_at * 1000);
      await sendEmail.welcomePremium(doctor.email, doctor.name, periodEnd);
    }
  } catch (error) {
    console.error("Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: { doctor: true },
    });

    if (!subscription) return;

    const gracePeriodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.PAST_DUE,
        gracePeriodEnd,
        paymentFailures: { increment: 1 },
      },
    });

    await sendEmail.paymentFailed(
      subscription.doctor.email,
      subscription.doctor.name,
      gracePeriodEnd
    );
  } catch (error) {
    console.error("Error in handlePaymentFailed:", error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: { doctor: true },
    });

    if (!subscription) return;

    const nextBillingDate = new Date(invoice.period_end * 1000);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        paymentFailures: 0,
        gracePeriodEnd: null,
      },
    });

    await sendEmail.paymentSucceeded(
      subscription.doctor.email,
      subscription.doctor.name,
      nextBillingDate
    );
  } catch (error) {
    console.error("Error in handlePaymentSucceeded:", error);
    throw error;
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  try {
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    const dbSubscription = await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
        plan: PlanType.PREMIUM, // Keep premium until period ends
        gracePeriodEnd: null, // No grace period for cancellations
      },
      include: { doctor: true },
    });

    if (dbSubscription.doctor) {
      await sendEmail.subscriptionCanceled(
        dbSubscription.doctor.email,
        dbSubscription.doctor.name,
        currentPeriodEnd
      );
    }
  } catch (error) {
    console.error("Error in handleSubscriptionCancelled:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { doctor: true },
    });

    if (!dbSubscription) return;

    if (subscription.cancel_at_period_end) {
      // Handling cancellation
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: SubscriptionStatus.CANCELED,
          canceledAt: new Date(),
          currentPeriodEnd: currentPeriodEnd,
          plan: PlanType.PREMIUM,
          gracePeriodEnd: null,
        },
      });

      // Send cancellation email
      if (dbSubscription.doctor) {
        await sendEmail.subscriptionCanceled(
          dbSubscription.doctor.email,
          dbSubscription.doctor.name,
          currentPeriodEnd
        );
      }
    } else if (dbSubscription.status === SubscriptionStatus.CANCELED) {
      // Handling reactivation
      const nextBillingDate = new Date(subscription.current_period_end * 1000);

      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          canceledAt: null,
          plan: PlanType.PREMIUM,
        },
      });

      // Optionally send reactivation email
      if (dbSubscription.doctor) {
        await sendEmail.subscriptionReactivated?.(
          dbSubscription.doctor.email,
          dbSubscription.doctor.name,
          nextBillingDate
        );
      }
    } else {
      // Handle regular updates
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: mapStripeStatusToPrisma(subscription.status),
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000
          ),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
  } catch (error) {
    console.error("Error in handleSubscriptionUpdated:", error);
    throw error;
  }
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
