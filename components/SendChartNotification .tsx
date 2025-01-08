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
import { Mail, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Zod schema for email notification
const emailNotificationSchema = z.object({
  emailSubject: z.string()
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject cannot exceed 100 characters")
    .optional()
    .default("Growth Chart Report"),
  additionalMessage: z.string()
    .max(500, "Message cannot exceed 500 characters")
    .optional(),
  // TODO: Add PDF URL generation and storage
  pdfUrl: z.string().url("Must be a valid URL").optional(),
  chartId: z.string().optional(), // Reference to the specific chart
  chartType: z.enum([
    "GROWTH_CDC",
    "GROWTH_WHO",
    "GROWTH_INTERGROWTH",
    "BLOOD_PRESSURE",
    "HEART_RATE",
    "BILIRUBIN"
  ]).optional(),
  notificationType: z.literal("CALCULATION_RESULTS"),
  recipientEmail: z.string().email("Invalid email address").optional(),
});

interface SendChartNotificationProps {
  chartData: any;
  patientId: string;
  chartType?: string;
  className?: string;
}

export const SendChartNotification: React.FC<SendChartNotificationProps> = ({
  chartData,
  patientId,
  chartType = "Growth Chart",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof emailNotificationSchema>>({
    resolver: zodResolver(emailNotificationSchema),
    defaultValues: {
      emailSubject: `${chartType} Report`,
      additionalMessage: "",
    },
  });

  // Mutation for sending notification
  const sendNotification = useMutation({
    mutationFn: async (values: z.infer<typeof emailNotificationSchema>) => {
      const response = await axios.post(
        "/api/dashboard/email-notifications/send",
        {
          ...values,
          patientId,
          chartData,
          chartType,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      setIsOpen(false);
    },
    onError: (error) => {
      // Handle error (you might want to add error handling UI)
      console.error("Failed to send notification", error);
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof emailNotificationSchema>) => {
    sendNotification.mutate({
      ...values,
      notificationType: "CALCULATION_RESULTS",
      chartId: chartData.id, // Assuming chartData has an id
      pdfUrl: 'generatedPdfUrl', // TODO: Implement PDF generation
    });
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

              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-medical-200 text-medical-700 hover:bg-medical-50"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={sendNotification.isPending}
                  className="bg-medical-600 text-white hover:bg-medical-700 focus:ring-medical-300"
                >
                  {sendNotification.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Notification"
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
