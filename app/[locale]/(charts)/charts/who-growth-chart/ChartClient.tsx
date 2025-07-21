"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import SmartLoader from "@/components/SmartLoader";
import WHOChartDisplay from "./WHOChartDisplay";
import { useSubscriptionStore } from "@/stores/premiumStore";
import ToggleViewChart from "@/components/ToggleViewChart";
import { useWHOChartData } from "@/hooks/calculations/use-who-chart-data";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from 'next-intl';

const Charts = () => {
  const t = useTranslations('WHOChartPage');
  const locale = useLocale();
  const { isFullCurveView } = useSubscriptionStore();
  const [showLoader, setShowLoader] = useState(true);

  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );

  // Get data but don't show it immediately
  const { data, isError, error, refetch } = useWHOChartData(searchParams);

  const handleLoaderComplete = () => {
    setShowLoader(false);
  };

  const handleRetry = () => {
    setShowLoader(true);
    refetch();
  };

  // If there's an error, hide loader and show error
  useEffect(() => {
    if (isError) {
      setShowLoader(false);
    }
  }, [isError]);

  // Show loader while processing or during simulation
  if (showLoader && !isError) {
    return (
      <SmartLoader
        type="growth"
        duration={2500} // 2.5 seconds of simulated processing
        onComplete={handleLoaderComplete}
      />
    );
  }

  if (isError) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-dvh-nav"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center max-w-md mx-auto p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="p-4 bg-red-50 rounded-full">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </motion.div>

          <motion.h2
            className="text-2xl font-semibold text-gray-900 mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {t('processingErrorTitle')}
          </motion.h2>

          <motion.p
            className="text-gray-600 mb-6 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {error instanceof Error
              ? error.message
              : t('processingErrorDescription')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleRetry}
              className="bg-medical-600 hover:bg-medical-700 text-white px-6 py-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('tryAgainButton')}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Ensure data structure is valid before rendering charts
  if (
    !data ||
    !data.success ||
    !data.data ||
    !data.data.weight ||
    !data.data.height
  ) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-dvh-nav"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center max-w-md mx-auto p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="p-4 bg-orange-50 rounded-full">
              <XCircle className="w-12 h-12 text-orange-500" />
            </div>
          </motion.div>

          <motion.h2
            className="text-2xl font-semibold text-gray-900 mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {t('invalidDataTitle')}
          </motion.h2>

          <motion.p
            className="text-gray-600 mb-6 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {t('invalidDataDescription')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2"
            >
              {t('goBackButton')}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="my-4 md:my-6 flex flex-col gap-6 px-4">
      <motion.div
        className="my-0 md:my-4 flex flex-col gap-1 text-center bg-gradient-to-r from-medical-800 to-medical-600 bg-clip-text text-transparent text-lg md:text-2xl lg:text-4xl font-bold tracking-tight leading-tight py-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h2>{t('whoGrowthStandardsTitle')}</h2>
        <span className="block text-sm md:text-base lg:text-xl text-medical-500 font-medium mt-1">
          {t('infantGrowthVisualizationSubtitle')}
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ToggleViewChart />
      </motion.div>

      {/* Render Weight Chart using reusable component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <WHOChartDisplay
          rawData={data}
          type="weight"
          isFullCurveView={isFullCurveView}
          monthRangeAround={isFullCurveView ? 24 : 6}
        />
      </motion.div>

      {/* Render Height Chart using reusable component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <WHOChartDisplay
          rawData={data}
          type="height"
          isFullCurveView={isFullCurveView}
          monthRangeAround={isFullCurveView ? 24 : 6}
        />
      </motion.div>
    </div>
  );
};

export default Charts;