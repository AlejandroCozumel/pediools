"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, Eye } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { captureCharts } from "@/utils/captureCharts";

// Types for progression data
interface ProgressionData {
  calculationId: string; // Add this
  date: string;
  age: string;
  weight: string;
  height: string;
  bmi: string;
  weightPercentile: number; // Add this
  heightPercentile: number; // Add this
}

// Types for weight and height data
interface PercentileData {
  calculatedPercentile: number;
}

interface MeasurementData {
  value: number;
  percentiles: PercentileData;
}

interface WeightData {
  ageInMonths: number;
  weight: MeasurementData;
}

interface HeightData {
  ageInMonths: number;
  height: MeasurementData;
}

// Types for the main chart data
interface ChartData {
  calculationId: string;
  progressionData: ProgressionData[];
  originalInput: {
    weight: {
      gender: "male" | "female";
    };
    height: {
      gender: "male" | "female";
    };
  };
  data: {
    weight: WeightData[];
    height: HeightData[];
  };
  success: boolean;
  patientDetails?: {
    name: string;
    email: string | null;
    guardianEmail: string | null;
    doctor: {
      name: string;
      clinic: {
        clinicName: string | null;
        logoUrl: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        postalCode: string | null;
        website: string | null;
      } | null;
    };
  } | null;
}

// Props interface
interface SendChartNotificationProps {
  chartData: ChartData;
  patientId: string;
  chartType?: string;
  className?: string;
}

// Zod schema for form validation
const emailNotificationSchema = z.object({
  recipientEmail: z.string().email("Please enter a valid email address"),
  emailSubject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject cannot exceed 100 characters")
    .optional()
    .default("Growth Chart Report"),
  additionalMessage: z
    .string()
    .max(500, "Message cannot exceed 500 characters")
    .optional(),
  notificationType: z.literal("CALCULATION_RESULTS").optional(),
});

type FormData = z.infer<typeof emailNotificationSchema>;

export const SendChartNotification: React.FC<SendChartNotificationProps> = ({
  chartData,
  patientId,
  chartType = "Growth Chart",
  className = "",
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(emailNotificationSchema),
    defaultValues: {
      emailSubject: `Growth Chart Report for ${
        chartData.patientDetails?.name || ""
      }`,
      additionalMessage: "",
      recipientEmail:
        chartData.patientDetails?.email ||
        chartData.patientDetails?.guardianEmail ||
        "",
      notificationType: "CALCULATION_RESULTS",
    },
  });

  // Function to handle PDF preview
  const handlePreviewPDF = async () => {
    let chartImages: string[] = [];
    try {
      setIsGeneratingPreview(true);

      chartImages = await captureCharts();

      if (!chartImages || chartImages.length === 0) {
        toast({
          title: "No charts found to generate preview.",
          description: "Please try again later.",
          variant: "destructive",
        });
        return;
      }

      const formValues = form.getValues();

      const response = await axios.post(
        "/api/dashboard/email-notifications/send",
        {
          chartData,
          chartImages,
          patientId,
          emailSubject: formValues.emailSubject,
          additionalMessage: formValues.additionalMessage,
          preview: true,
        }
      );

      if (response.data?.data?.pdfUrl) {
        window.open(response.data.data.pdfUrl, "_blank");
      } else {
        throw new Error("No PDF URL received");
      }
    } catch (error) {
      console.error("Failed to generate preview:", error);
      toast({
        title: "Failed to generate preview",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Mutation for sending notification
  const sendNotification = useMutation({
    mutationFn: async (values: FormData) => {
      const chartImages = await captureCharts();

      if (!chartImages || chartImages.length === 0) {
        throw new Error("No charts found to send.");
      }

      const response = await axios.post(
        "/api/dashboard/email-notifications/send",
        {
          ...values,
          patientId,
          chartData,
          chartImages,
          preview: false,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Email sent successfully!",
        description: "Email has been sent to the patient.",
        variant: "default",
      });
      form.reset();
      setIsOpen(false);
    },
    onError: (error) => {
      console.error("Failed to send notification:", error);
      if (
        error instanceof Error &&
        error.message === "No charts found to send."
      ) {
        toast({
          title: "No charts found to send",
          description: "Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to send chart",
          description: "Please double check the email is correct.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (values: FormData) => {
    sendNotification.mutate(values);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 border-medical-200 text-medical-700 hover:bg-medical-50 ${className}`}
      >
        <Mail className="h-4 w-4 text-medical-500" />
        Send Chart to Patient
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-lg border-medical-100">
          <DialogHeader>
            <DialogTitle className="text-medical-900 font-heading">
              Send Chart Notification
            </DialogTitle>
            <DialogDescription className="text-medical-600">
              Send a {chartType} report
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Recipient Email */}
              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-medical-700">
                      Recipient Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter recipient email"
                        {...field}
                        className="border-medical-200 focus:border-medical-300 focus:ring-medical-100"
                      />
                    </FormControl>
                    <FormMessage className="text-medical-pink-600" />
                  </FormItem>
                )}
              />

              {/* Email Subject */}
              <FormField
                control={form.control}
                name="emailSubject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-medical-700">
                      Email Subject
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter email subject"
                        {...field}
                        className="border-medical-200 focus:border-medical-300 focus:ring-medical-100"
                      />
                    </FormControl>
                    <FormMessage className="text-medical-pink-600" />
                  </FormItem>
                )}
              />

              {/* Additional Message */}
              <FormField
                control={form.control}
                name="additionalMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-medical-700">
                      Additional Message (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Add a personal note"
                        {...field}
                        className="border-medical-200 focus:border-medical-300 focus:ring-medical-100"
                      />
                    </FormControl>
                    <FormMessage className="text-medical-pink-600" />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex !justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviewPDF}
                  disabled={isGeneratingPreview}
                >
                  {isGeneratingPreview ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview PDF
                    </>
                  )}
                </Button>

                <Button
                  type="submit"
                  disabled={sendNotification.isPending}
                  variant="default"
                >
                  {sendNotification.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SendChartNotification;
