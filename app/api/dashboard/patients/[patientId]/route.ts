// app/api/dashboard/patients/[patientId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

// export async function GET(
//   request: NextRequest,
//   context: { params: { patientId: string } }
// ) {
//   try {
//     const { userId } = getAuth(request);

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const doctor = await prisma.doctor.findUnique({
//       where: {
//         clerkUserId: userId,
//       },
//     });

//     if (!doctor) {
//       return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
//     }

//     const patient = await prisma.patient.findUnique({
//       where: {
//         id: context.params.patientId,
//         doctorId: doctor.id,
//       },
//     });

//     if (!patient) {
//       return NextResponse.json({ error: "Patient not found" }, { status: 404 });
//     }

//     return NextResponse.json(patient);
//   } catch (error) {
//     console.error("[PATIENT_GET]", error);
//     return NextResponse.json({ error: "Internal error" }, { status: 500 });
//   }
// }

// // PATCH update patient
// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: { patientId: string } }
// ) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const doctor = await prisma.doctor.findUnique({
//       where: {
//         clerkUserId: userId,
//       },
//     });

//     if (!doctor) {
//       return new NextResponse("Doctor not found", { status: 404 });
//     }

//     const body = await req.json();

//     // Verify patient belongs to doctor
//     const existingPatient = await prisma.patient.findUnique({
//       where: {
//         id: params.patientId,
//         doctorId: doctor.id,
//       },
//     });

//     if (!existingPatient) {
//       return new NextResponse("Patient not found", { status: 404 });
//     }

//     const updatedPatient = await prisma.patient.update({
//       where: {
//         id: params.patientId,
//       },
//       data: {
//         firstName: body.firstName,
//         paternalLastName: body.paternalLastName,
//         maternalLastName: body.maternalLastName,
//         dateOfBirth: new Date(body.dateOfBirth),
//         gender: body.gender,
//         email: body.email,
//         phoneNumber: body.phoneNumber,
//         secondaryPhone: body.secondaryPhone,
//         address: body.address,
//         city: body.city,
//         state: body.state,
//         zipCode: body.zipCode,
//         country: body.country,
//         bloodType: body.bloodType,
//         allergies: body.allergies,
//         medications: body.medications,
//         medicalNotes: body.medicalNotes,
//         insuranceInfo: body.insuranceInfo,
//         emergencyContact: body.emergencyContact,
//         guardianName: body.guardianName,
//         guardianPhone: body.guardianPhone,
//         guardianEmail: body.guardianEmail,
//         guardianRelation: body.guardianRelation,
//       },
//     });

//     return NextResponse.json(updatedPatient);
//   } catch (error) {
//     console.error("[PATIENT_PATCH]", error);
//     return new NextResponse("Internal error", { status: 500 });
//   }
// }

// // DELETE patient
// export async function DELETE(
//   req: NextRequest,
//   { params }: { params: { patientId: string } }
// ) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const doctor = await prisma.doctor.findUnique({
//       where: {
//         clerkUserId: userId,
//       },
//     });

//     if (!doctor) {
//       return new NextResponse("Doctor not found", { status: 404 });
//     }

//     // Verify patient belongs to doctor
//     const patient = await prisma.patient.findUnique({
//       where: {
//         id: params.patientId,
//         doctorId: doctor.id,
//       },
//     });

//     if (!patient) {
//       return new NextResponse("Patient not found", { status: 404 });
//     }

//     await prisma.patient.delete({
//       where: {
//         id: params.patientId,
//       },
//     });

//     return new NextResponse(null, { status: 204 });
//   } catch (error) {
//     console.error("[PATIENT_DELETE]", error);
//     return new NextResponse("Internal error", { status: 500 });
//   }
// }

export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 404 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Not implemented" }, { status: 404 });
}
export async function DELETE() {
  return NextResponse.json({ error: "Not implemented" }, { status: 404 });
}
