import { getSeoMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: { locale?: string } }): Promise<Metadata> => {
  const locale = params?.locale || "en";
  const t = await getTranslations({ locale, namespace: "Contact" });
  return getSeoMetadata({
    title: t("title", { defaultValue: "Contact - PediMath" }),
    description: t("description", { defaultValue: "Contact PediMath for support, feedback, or partnership inquiries." }),
    url: `https://www.pedimath.com/${locale}/contact`,
    image: "/og-image.jpg",
    locale,
    keywords: ["contact PediMath", "support", "medical calculators"]
  });
};

export default function Contact() {
  return <div>Contact</div>;
}