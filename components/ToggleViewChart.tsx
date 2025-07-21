import React from "react";
import { useSubscriptionStore } from "@/stores/premiumStore";
import { useTranslations } from 'next-intl';

export const ToggleViewChart = () => {
  const t = useTranslations('ToggleViewChart');
  const { isFullCurveView, toggleFullCurveView } = useSubscriptionStore();

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex items-center justify-center bg-medical-50 rounded-full p-1">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            !isFullCurveView
              ? "bg-medical-600 text-white shadow-md"
              : "text-medical-600 hover:bg-medical-100"
          }`}
          onClick={() => toggleFullCurveView()}
        >
          {t('focusedView')}
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            isFullCurveView
              ? "bg-medical-600 text-white shadow-md"
              : "text-medical-600 hover:bg-medical-100"
          }`}
          onClick={() => toggleFullCurveView()}
        >
          {t('fullCurve')}
        </button>
      </div>
      <p className="text-xs text-medical-500 text-center">
        {isFullCurveView
          ? t('fullCurveDescription')
          : t('focusedViewDescription')}
      </p>
    </div>
  );
};

export default ToggleViewChart;
