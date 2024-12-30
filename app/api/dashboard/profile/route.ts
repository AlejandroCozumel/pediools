// app/api/doctor/profile/route.ts
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prismadb";

const defaultProfileValues = {
  prefix: "",
  specialty: "",
  licenseNumber: "",
  clinicName: "",
  phoneNumber: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  logoUrl: "",
  signatureUrl: "",
  primaryColor: "#2563EB",
  secondaryColor: "#1E40AF",
  headerText: "",
  footerText: "",
  website: "",
  socialMedia: {
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
  },
};

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

    // If there's no profile, return default values
    if (!doctor.profile) {
      return NextResponse.json({
        profile: defaultProfileValues
      });
    }

    // Return the profile data in the expected format
    return NextResponse.json({
      profile: {
        prefix: doctor.profile.prefix || "",
        specialty: doctor.profile.specialty || "",
        licenseNumber: doctor.profile.licenseNumber || "",
        clinicName: doctor.profile.clinicName || "",
        phoneNumber: doctor.profile.phoneNumber || "",
        address: doctor.profile.address || "",
        city: doctor.profile.city || "",
        state: doctor.profile.state || "",
        country: doctor.profile.country || "",
        postalCode: doctor.profile.postalCode || "",
        logoUrl: doctor.profile.logoUrl || "",
        signatureUrl: doctor.profile.signatureUrl || "",
        primaryColor: doctor.profile.primaryColor || "#2563EB",
        secondaryColor: doctor.profile.secondaryColor || "#1E40AF",
        headerText: doctor.profile.headerText || "",
        footerText: doctor.profile.footerText || "",
        website: doctor.profile.website || "",
        socialMedia: doctor.profile.socialMedia || {
          facebook: "",
          twitter: "",
          linkedin: "",
          instagram: "",
        },
      }
    });

  } catch (error) {
    console.error("[DOCTOR_PROFILE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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