import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "FAQ" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "FAQ - PediMath" }),
    description: t("description", { defaultValue: "Frequently asked questions about PediMath's pediatric tools." }),
    url: `https://www.pedimath.com/${locale}/faq`,
    image: "/og-image.jpg",
    locale,
    keywords: ["FAQ", "pediatric tools", "medical calculators"]
  });
};

export default function FAQ() {
  return <div>FAQ</div>;
}