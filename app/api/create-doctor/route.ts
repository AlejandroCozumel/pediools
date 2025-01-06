import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingDoctor = await prisma.doctor.findUnique({
      where: { clerkUserId: userId }
    });

    if (existingDoctor) {
      return NextResponse.json({ error: "Doctor already exists" }, { status: 400 });
    }

    const newDoctor = await prisma.doctor.create({
      data: {
        clerkUserId: userId,
        email: user.emailAddresses[0].emailAddress,
        name: user.firstName ?? '',
        lastName: user.lastName ?? '',
        profilePicture: user.imageUrl ?? '',
        defaultChartView: 'FOCUSED',
      }
    });

    return NextResponse.json({
      message: "Doctor created successfully",
      doctor: newDoctor
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}