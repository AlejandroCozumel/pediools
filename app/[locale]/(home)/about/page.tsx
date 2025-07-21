import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "About" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "About - PediMath" }),
    description: t("description", { defaultValue: "Learn more about PediMath and our pediatric calculation tools." }),
    url: `https://www.pedimath.com/${locale}/about`,
    image: "/og-image.jpg",
    locale,
    keywords: ["about PediMath", "pediatric tools", "medical calculators"]
  });
};

export default function About() {
  return <div>About</div>;
}