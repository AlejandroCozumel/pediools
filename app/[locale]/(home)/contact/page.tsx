import React from 'react'
import SeoMeta from "@/components/SeoMeta";
import { useTranslations, useLocale } from "next-intl";

const Contact = () => {
  const t = useTranslations("Contact");
  const locale = useLocale();
  return (
    <>
      <SeoMeta
        title={t("title", { defaultValue: "Contact - PediMath" })}
        description={t("description", { defaultValue: "Contact PediMath for support, feedback, or partnership inquiries." })}
        image="/og-image.jpg"
        url={`https://www.pedimath.com/${locale}/contact`}
      />
      <div>Contact</div>
    </>
  );
}

export default Contact