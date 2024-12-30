import React from 'react'
import { Loader2 } from "lucide-react";

const LoaderSpinnner = () => {
  return (
    <div className="flex items-center justify-center min-h-dvh">
    <Loader2 className="h-8 w-8 animate-spin text-medical-600" />
  </div>
  )
}

export default LoaderSpinnner