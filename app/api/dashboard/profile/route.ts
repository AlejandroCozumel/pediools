// app/api/doctor/profile/route.ts
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prismadb";

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        clerkUserId: userId,
      },
      include: {
        profile: true,
      },
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("[DOCTOR_PROFILE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    console.log("Clerk User ID:", userId);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    const doctor = await prisma.doctor.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    const profile = await prisma.doctorProfile.upsert({
      where: {
        doctorId: doctor.id,
      },
      update: {
        prefix: body.prefix,
        specialty: body.specialty,
        licenseNumber: body.licenseNumber,
        clinicName: body.clinicName,
        phoneNumber: body.phoneNumber,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        postalCode: body.postalCode,
        logoUrl: body.logoUrl,
        signatureUrl: body.signatureUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        headerText: body.headerText,
        footerText: body.footerText,
        website: body.website,
        socialMedia: body.socialMedia,
      },
      create: {
        doctorId: doctor.id,
        prefix: body.prefix,
        specialty: body.specialty,
        licenseNumber: body.licenseNumber,
        clinicName: body.clinicName,
        phoneNumber: body.phoneNumber,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        postalCode: body.postalCode,
        logoUrl: body.logoUrl,
        signatureUrl: body.signatureUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        headerText: body.headerText,
        footerText: body.footerText,
        website: body.website,
        socialMedia: body.socialMedia,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[DOCTOR_PROFILE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    const doctor = await prisma.doctor.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    const profile = await prisma.doctorProfile.update({
      where: {
        doctorId: doctor.id,
      },
      data: body,
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[DOCTOR_PROFILE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 });
    }

    await prisma.doctorProfile.delete({
      where: {
        doctorId: doctor.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DOCTOR_PROFILE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
