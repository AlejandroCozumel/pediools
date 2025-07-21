import React from "react";
import { useTranslations } from "next-intl";

const AppDisclaimer: React.FC = () => {
  const t = useTranslations("AppDisclaimer");
  return (
    <div className="max-container mx-auto !mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded text-xs">
      <strong>{t("title")}</strong>
      <p>{t("referenceAid")}</p>
      <p>{t("confirmInformation")}</p>
      <p>{t("noWarranties")}</p>
      <p>{t("acceptance")}</p>
    </div>
  );
};

export default AppDisclaimer;