// app/billing/page.tsx
"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCustomerPortal } from "@/hooks/use-customer-portal";
import { SubscriptionStatus } from "@/app/[locale]/(dashboard)/dashboard/profile/billing/SubscriptionStatus";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/Spinner";
import DashboardTitle from "@/components/DashboardTitle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoaderSpinnner from "@/components/LoaderSpinnner";

const BillingPortal = () => {
  const { openPortal, isLoading: portalLoading } = useCustomerPortal();

  const {
    data: subscriptionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      const response = await fetch("/api/subscription-status");
      if (!response.ok) {
        throw new Error("Failed to fetch subscription status");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div>
        <LoaderSpinnner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load subscription status</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="my-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        <DashboardTitle
          title="Billing & Subscription"
          subtitle="Manage your subscription plan, payment methods, and billing history"
        />

        {subscriptionData && <SubscriptionStatus data={subscriptionData} />}

        <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-medical-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative p-3">
            <div className="flex items-center justify-between mb-2">
              <ExternalLink className="h-4 w-4 text-medical-500" />
              <Badge
                variant="default"
                className="text-xs bg-medical-600 hover:bg-medical-700 transition-colors"
              >
                Portal
              </Badge>
            </div>
            <CardTitle className="text-sm mb-1 text-medical-900 group-hover:text-medical-700 transition-colors font-heading">
              Billing Portal Access
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground/80 leading-relaxed">
              Manage your subscription, view billing history, and update payment
              methods
            </CardDescription>
          </CardHeader>
          <CardContent className="relative p-3 pt-0">
            <Button
              onClick={() => openPortal()}
              disabled={portalLoading}
              className="w-full bg-medical-600 hover:bg-medical-700 text-white"
            >
              {portalLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner />
                  <span>Loading...</span>
                </div>
              ) : (
                "Open Billing Portal"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingPortal;
