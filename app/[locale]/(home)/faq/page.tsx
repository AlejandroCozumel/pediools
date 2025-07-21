import React from 'react'
import SeoMeta from "@/components/SeoMeta";
import { useTranslations, useLocale } from "next-intl";

const FAQ = () => {
  const t = useTranslations("FAQ");
  const locale = useLocale();
  return (
    <>
      <SeoMeta
        title={t("title", { defaultValue: "FAQ - PediMath" })}
        description={t("description", { defaultValue: "Frequently asked questions about PediMath's pediatric tools." })}
        image="/og-image.jpg"
        url={`https://www.pedimath.com/${locale}/faq`}
      />
      <div>FAQ</div>
    </>
  );
}

export default FAQ