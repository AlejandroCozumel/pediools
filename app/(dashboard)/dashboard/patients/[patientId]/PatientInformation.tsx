"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  HeartPulse,
  UserCheck,
  Stethoscope,
  FileText,
  LineChart,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PatientInformationProps {
  patient: any;
}

const PatientInformation: React.FC<PatientInformationProps> = ({ patient }) => {

  const params = useParams();
  const patientId = params.patientId as string;

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    if (years === 0) {
      return `${months}m`;
    }
    return `${years}y ${months >= 0 ? months : 12 + months}m`;
  };

  return (
    <div className="container mx-auto my-6 px-4 md:px-0">
      {/* Header Section */}
      <div className="mb-8 space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight font-heading text-medical-900">
            {patient.patientName} {patient.lastName}
          </h1>
          <div className="flex items-center space-x-2">
            <Link href={`/dashboard/patients/${patientId}/edit`}>
              <Button
                variant="outline"
                className="border-medical-200 text-medical-700"
              >
                Edit Patient
              </Button>
            </Link>
            <Badge
              variant="outline"
              className={
                patient.status === "Active"
                  ? "border-green-200 text-green-700 bg-green-50"
                  : "border-medical-pink-200 text-medical-pink-700 bg-medical-pink-50"
              }
            >
              {patient.status || "Unknown Status"}
            </Badge>
          </div>
        </div>
        <p className="text-medical-600 text-lg leading-relaxed">
          Patient Details and Medical Information
        </p>
      </div>

      {/* Personal Information Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-medical-100">
          <CardHeader>
            <CardTitle className="flex items-center text-medical-900">
              <Users className="mr-2 h-5 w-5 text-medical-500" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-medical-600">First Name</p>
              <p className="font-medium">{patient.firstName || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-medical-600">Last Name</p>
              <p className="font-medium">{patient.lastName || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-medical-600">Date of Birth</p>
              <p className="font-medium">
                {patient.dateOfBirth
                  ? `${new Date(
                      patient.dateOfBirth
                    ).toLocaleDateString()} (${calculateAge(
                      patient.dateOfBirth
                    )})`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-medical-600">Gender</p>
              <p className="font-medium">{patient.gender || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card className="border-medical-100">
          <CardHeader>
            <CardTitle className="flex items-center text-medical-900">
              <Mail className="mr-2 h-5 w-5 text-medical-500" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-medical-600">Email</p>
              <p className="font-medium">{patient.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-medical-600">Phone Number</p>
              <p className="font-medium">{patient.phoneNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-medical-600">Address</p>
              <p className="font-medium">
                {patient.address
                  ? `${patient.address}, ${patient.city || ""} ${
                      patient.state || ""
                    }`
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information Card */}
        <Card className="border-medical-100">
          <CardHeader>
            <CardTitle className="flex items-center text-medical-900">
              <Stethoscope className="mr-2 h-5 w-5 text-medical-500" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-medical-600">Blood Type</p>
              <p className="font-medium">{patient.bloodType || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-medical-600">Allergies</p>
              <p className="font-medium">{patient.allergies || "None"}</p>
            </div>
            <div>
              <p className="text-xs text-medical-600">Medications</p>
              <p className="font-medium">{patient.medications || "None"}</p>
            </div>
            <div>
              <p className="text-xs text-medical-600">Medical Notes</p>
              <p className="font-medium">
                {patient.medicalNotes || "No notes"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Information Card */}
        {(patient.guardianName ||
          patient.guardianPhone ||
          patient.guardianEmail) && (
          <Card className="border-medical-100">
            <CardHeader>
              <CardTitle className="flex items-center text-medical-900">
                <UserCheck className="mr-2 h-5 w-5 text-medical-500" />
                Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-medical-600">Guardian Name</p>
                <p className="font-medium">{patient.guardianName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-medical-600">Relation</p>
                <p className="font-medium">
                  {patient.guardianRelation || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-medical-600">Guardian Phone</p>
                <p className="font-medium">{patient.guardianPhone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-medical-600">Guardian Email</p>
                <p className="font-medium">{patient.guardianEmail || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientInformation;
