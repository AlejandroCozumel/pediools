"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useEmailNotifications } from "@/hooks/use-email-notifications";
import LoaderSpinnner from "@/components/LoaderSpinnner";
import DashboardTitle from "@/components/DashboardTitle";
import StatsCard from "@/components/StatsCard";
import { MailIcon, CalendarIcon, UsersIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmailNotificationsTable from "@/app/(dashboard)/dashboard/notifications/EmailNotificationsTable";

const Notifications = () => {
  const router = useRouter();
  const {
    emailNotifications,
    isLoading,
    error,
    resendNotification,
    deleteNotification,
  } = useEmailNotifications();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-medical-600">
        Something went wrong loading your email notifications.
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <LoaderSpinnner />;
  }

  return (
    <div className="my-6">
      <div className="flex flex-col items-start mb-4">
        <DashboardTitle
          title="Email Notifications Dashboard"
          subtitle="View and manage email notifications sent to patients"
        />
        <Button
          className="mb-4"
          variant="default"
          onClick={() => router.push("/dashboard/notifications/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Send Notification
        </Button>
      </div>
      <div className="flex flex-col-reverse md:flex-col gap-4 md:gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Notifications"
            value={emailNotifications?.totalEmailNotifications || 0}
            icon={<MailIcon className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Unique Patients"
            value={
              emailNotifications?.emailNotifications
                ? new Set(
                    emailNotifications.emailNotifications.map(
                      (n: { patientId: string }) => n.patientId
                    )
                  ).size
                : 0
            }
            icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />}
          />
          <StatsCard
            title="Notifications This Month"
            value={emailNotifications?.emailNotificationsThisMonth || 0}
            previousValue={emailNotifications?.emailNotificationsLastMonth || 0}
            icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <EmailNotificationsTable
          notifications={emailNotifications?.emailNotifications || []}
          onResend={(params) => resendNotification.mutate(params)}
          onDelete={(params) => deleteNotification.mutate(params)}
        />
      </div>
    </div>
  );
};

export default Notifications;
