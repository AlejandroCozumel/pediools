// lib/email.ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = {
  welcomePremium: async (email: string, name: string, periodEnd: Date) => {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Welcome to PedTools Premium!",
      html: `
        <h1>Welcome to Premium, ${name}!</h1>
        <p>Thank you for subscribing to PedTools Premium.</p>
        <p>Your subscription is active until ${periodEnd.toLocaleDateString()}.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
      `,
    });
  },

  paymentFailed: async (email: string, name: string, gracePeriodEnd: Date) => {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Payment Failed - Action Required",
      html: `
        <h1>Payment Failed</h1>
        <p>Hi ${name},</p>
        <p>We couldn't process your payment for PedTools Premium.</p>
        <p>Please update your payment method by ${gracePeriodEnd.toLocaleDateString()} to maintain uninterrupted access.</p>
        <p>After this date, your premium features may be limited until payment is resolved.</p>
      `,
    });
  },

  paymentSucceeded: async (email: string, name: string, nextBillingDate: Date) => {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Payment Successful",
      html: `
        <h1>Payment Successful</h1>
        <p>Thank you, ${name}.</p>
        <p>Your payment for PedTools Premium was processed successfully.</p>
        <p>Your next billing date is ${nextBillingDate.toLocaleDateString()}.</p>
      `,
    });
  },

  subscriptionCanceled: async (email: string, name: string, endDate: Date) => {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: 'richard190982@gmail.com',
      subject: "Subscription Cancelled",
      html: `
        <h1>Subscription Cancelled</h1>
        <p>Hi ${name},</p>
        <p>Your PedTools Premium subscription has been cancelled as requested.</p>
        <p>You'll continue to have access to all premium features until ${endDate.toLocaleDateString()}.</p>
        <p>After this date, your account will revert to the free plan.</p>
        <p>We hope to see you again soon!</p>
      `,
    });
  },

  subscriptionReactivated: async (email: string, name: string, nextBillingDate: Date) => {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: 'richard190982@gmail.com',
      subject: "Subscription Reactivated",
      html: `
        <h1>Welcome Back!</h1>
        <p>Hi ${name},</p>
        <p>Great news! Your PedTools Premium subscription has been reactivated.</p>
        <p>Your next billing date will be ${nextBillingDate.toLocaleDateString()}.</p>
        <p>You'll continue to have uninterrupted access to all premium features.</p>
      `,
    });
  },
};