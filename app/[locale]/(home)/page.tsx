import React from "react";
import CalculatorsList from "./CalculatorsList";
import SeoMeta from "@/components/SeoMeta";
import { useTranslations, useLocale } from "next-intl";

const Home = () => {
  const t = useTranslations("CalculatorsList");
  const locale = useLocale();
  const title = t("dashboardTitle");
  const description = t("dashboardSubtitle");
  const image = "/og-image.jpg";
  const url = "https://www.pedimath.com/" + locale;
  return (
    <>
      <SeoMeta
        title={title}
        description={description}
        image={image}
        url={url}
      />
      <CalculatorsList />
    </>
  );
};

export default Home;