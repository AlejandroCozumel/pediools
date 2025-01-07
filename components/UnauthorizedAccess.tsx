import React from 'react';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';

const UnauthorizedAccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-medical-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full space-y-6">
        <CardHeader className="space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-medical-100 p-5">
              <Lock className="w-12 h-12 text-medical-600 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-medical-900 font-heading">401</h1>
            <h2 className="text-xl font-semibold text-medical-700 font-heading">
              Unauthorized Access
            </h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert variant="destructive" className="border-medical-200 bg-medical-50">
            <AlertCircle className="h-4 w-4 text-medical-600" />
            <AlertTitle className="text-medical-700">Access Denied</AlertTitle>
            <AlertDescription className="text-medical-600">
              You don't have permission to access this resource. This area is reserved for premium users.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Button
              onClick={() => window.history.back()}
              className="w-full bg-medical-600 hover:bg-medical-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>

            <Button
              onClick={() => window.location.href = '/subscribe'}
              variant="outline"
              className="w-full border-medical-200 text-medical-700 hover:bg-medical-50"
            >
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>

        <CardFooter>
          <p className="text-center text-sm text-medical-500 w-full">
            Need help? Contact our support team for assistance.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UnauthorizedAccess;