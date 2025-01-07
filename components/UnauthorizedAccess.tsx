import React from 'react';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const UnauthorizedAccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-lg shadow-xl">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-5">
            <Lock className="w-12 h-12 text-red-600 animate-pulse" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">401</h1>
          <h2 className="text-xl font-semibold text-gray-700">Unauthorized Access</h2>
        </div>

        <Alert variant="destructive" className="border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this resource. Please verify your credentials and try again.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
          >
            Go Home
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          If you believe this is a mistake, please contact support for assistance.
        </p>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;