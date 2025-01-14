"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PatientData, patientSchema } from "@/hooks/use-patient";
import { motion, AnimatePresence } from "framer-motion";
import PersonalInfoTab from "./PersonalInfoTab";
import ContactInfoTab from "./ContactInfoTab";
import MedicalInfoTab from "./MedicalInfoTab";
import GuardianInfoTab from "./GuardianInfoTab";

interface PatientInformationProps {
  patient: PatientData;
  savePatient: any;
}

const tabContentVariants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.76, 0, 0.24, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: [0.76, 0, 0.24, 1],
    },
  },
};

const PatientInformation = ({
  patient,
  savePatient,
}: PatientInformationProps) => {
  const { toast } = useToast();
  const form = useForm<PatientData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient,
  });

  const handleSectionSave = async (
    sectionData: Partial<PatientData>,
    section: string
  ) => {
    try {
      await savePatient.mutateAsync(sectionData);

      toast({
        title: "Changes saved",
        description: `${section} information updated successfully.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving changes",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

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
    <div className="container mx-auto my-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tight font-heading text-medical-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-medical-600 mt-2">
              {patient.dateOfBirth && calculateAge(patient.dateOfBirth)} •{" "}
              {patient.gender}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              patient.status === "Active"
                ? "border-green-200 text-green-700 bg-green-50"
                : "border-medical-200 text-medical-700"
            }
          >
            {patient.status || "Unknown Status"}
          </Badge>
        </motion.div>
      </div>

      {/* Form with Tabs */}
      <Form {...form}>
        <Tabs defaultValue="personal" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <TabsList>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="guardian">Guardian</TabsTrigger>
            </TabsList>
          </motion.div>

          <AnimatePresence>
            <TabsContent key="personal" value="personal" asChild>
              <motion.div
                variants={tabContentVariants}
                initial="initial"
                animate="enter"
                exit="exit"
              >
                <PersonalInfoTab
                  form={form}
                  onSave={handleSectionSave}
                  isLoading={savePatient?.isPending || false}
                />
              </motion.div>
            </TabsContent>

            <TabsContent key="contact" value="contact" asChild>
              <motion.div
                variants={tabContentVariants}
                initial="initial"
                animate="enter"
                exit="exit"
              >
                <ContactInfoTab
                  form={form}
                  onSave={handleSectionSave}
                  isLoading={savePatient?.isPending || false}
                />
              </motion.div>
            </TabsContent>

            <TabsContent key="medical" value="medical" asChild>
              <motion.div
                variants={tabContentVariants}
                initial="initial"
                animate="enter"
                exit="exit"
              >
                <MedicalInfoTab
                  form={form}
                  onSave={handleSectionSave}
                  isLoading={savePatient?.isPending || false}
                />
              </motion.div>
            </TabsContent>

            <TabsContent key="guardian" value="guardian" asChild>
              <motion.div
                variants={tabContentVariants}
                initial="initial"
                animate="enter"
                exit="exit"
              >
                <GuardianInfoTab
                  form={form}
                  onSave={handleSectionSave}
                  isLoading={savePatient?.isPending || false}
                />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </Form>
    </div>
  );
};

export default PatientInformation;
