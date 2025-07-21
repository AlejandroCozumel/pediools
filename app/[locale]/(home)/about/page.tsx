import React from 'react'
import SeoMeta from "@/components/SeoMeta";
import { useTranslations, useLocale } from "next-intl";

const About = () => {
  const t = useTranslations("About");
  const locale = useLocale();
  return (
    <>
      <SeoMeta
        title={t("title", { defaultValue: "About - PediMath" })}
        description={t("description", { defaultValue: "Learn more about PediMath and our pediatric calculation tools." })}
        image="/og-image.jpg"
        url={`https://www.pedimath.com/${locale}/about`}
      />
      <div>About</div>
    </>
  );
}

export default About