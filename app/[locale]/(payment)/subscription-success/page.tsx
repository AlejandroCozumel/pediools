import DashboardTitle from "@/components/DashboardTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SubscriptionSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="pb-4">
        <DashboardTitle
          title="Subscription Successful"
          subtitle="Thank you for upgrading to our premium plan"
          align="center"
        />
      </div>

      <Card className="max-w-xl mx-auto">
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="w-16 h-16 text-medical-500 mb-4" />
          <CardTitle className="text-2xl">Payment Confirmed</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-medical-800">
            Your subscription is now active. You have full access to all premium
            features.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild variant="default">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/account/subscription">Manage Subscription</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
