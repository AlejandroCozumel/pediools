// app/api/subscription-status/route.ts
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId },
      select: {
        subscription: {
          select: {
            status: true,
            plan: true,
            currentPeriodEnd: true
          }
        }
      }
    });

    if (!doctor?.subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    return NextResponse.json(doctor.subscription);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}