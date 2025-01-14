import React from "react";
import CalculatorsList from "./CalculatorsList";
import { useTranslations } from "next-intl";

const Home = () => {
  const t = useTranslations("HomePage");

  return (
    <>
      <CalculatorsList />
      <h1>{t("title")}</h1>
    </>
  );
};

export default Home;