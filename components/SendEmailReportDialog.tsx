// components/SendEmailReportDialog.tsx

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

// Types for the main chart data
interface ChartData {
  calculationId: string;
  patientDetails?: {
    name: string;
    email: string | null;
    guardianEmail: string | null;
  } | null;
}

// Props interface
interface SendEmailReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: ChartData | null;
  patientId: string;
  pdfUrl: string;
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

export const SendEmailReportDialog: React.FC<SendEmailReportDialogProps> = ({
  isOpen,
  onClose,
  chartData,
  patientId,
  pdfUrl,
}) => {
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
    }
  }, [isOpen]);

  const form = useForm<FormData>({
    resolver: zodResolver(emailNotificationSchema),
    defaultValues: {
      emailSubject: `Growth Chart Report for ${
        chartData?.patientDetails?.name || ""
      }`,
      additionalMessage: "",
      recipientEmail:
        chartData?.patientDetails?.email ||
        chartData?.patientDetails?.guardianEmail ||
        "",
      notificationType: "CALCULATION_RESULTS",
    },
  });

  // Mutation for sending email report
  const sendEmailReport = useMutation({
    mutationFn: async (values: FormData) => {
      const response = await axios.post(
        "/api/dashboard/email-notifications/calc-email-send",
        {
          ...values,
          patientId,
          chartData,
          pdfUrl,
          preview: false,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Email sent successfully!",
        description: "Email report has been sent to the patient.",
        variant: "default",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      console.error("Failed to send email report:", error);
      toast({
        title: "Failed to send email report",
        description: "Please double check the email is correct.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormData) => {
    sendEmailReport.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-lg border-medical-100">
        <DialogHeader>
          <DialogTitle className="text-medical-900 font-heading">
            Send Email Report
          </DialogTitle>
          <DialogDescription className="text-medical-600">
            Send the growth chart report via email
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

            <DialogFooter>
              <Button
                type="submit"
                disabled={sendEmailReport.isPending}
                variant="default"
              >
                {sendEmailReport.isPending ? (
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
  );
};

export default SendEmailReportDialog;
