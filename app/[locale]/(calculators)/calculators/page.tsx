import { Activity, DropletsIcon, FlaskConical, LineChart, Pill, RulerIcon } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getSeoMetadata } from "@/lib/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const generateMetadata = async ({
  params,
}: {
  params: { locale?: string };
}): Promise<Metadata> => {
  const locale = params?.locale || "en";

  return getSeoMetadata({
    title: locale === "es" ? "Calculadoras Pediátricas" : "Pediatric Calculators",
    description:
      locale === "es"
        ? "Explora calculadoras pediátricas para crecimiento, IMC, dosis, laboratorio, presión arterial y bilirrubina."
        : "Explore pediatric calculators for growth, BMI, dosing, lab interpretation, blood pressure, and bilirubin.",
    url: `https://www.pedimath.com/${locale}/calculators`,
    locale,
    keywords: ["pediatric calculators", "medical calculators", "growth calculator", "dose calculator"],
  });
};

export default async function CalculatorsIndex({
  params: { locale = "en" },
}: {
  params: { locale?: string };
}) {
  const t = await getTranslations({ locale, namespace: "CalculatorsList" });

  const items = [
    {
      title: t("calculators.growthPercentiles.title"),
      description: t("calculators.growthPercentiles.description"),
      category: t("categories.growth"),
      href: "/calculators/growth-calculator",
      icon: LineChart,
    },
    {
      title: t("calculators.bmi.title"),
      description: t("calculators.bmi.description"),
      category: t("categories.growth"),
      href: "/calculators/bmi-calculator",
      icon: RulerIcon,
    },
    {
      title: t("calculators.dose.title"),
      description: t("calculators.dose.description"),
      category: t("categories.dose"),
      href: "/calculators/dose-calculator",
      icon: Pill,
    },
    {
      title: t("calculators.lab.title"),
      description: t("calculators.lab.description"),
      category: t("categories.labs"),
      href: "/calculators/lab-calculator",
      icon: FlaskConical,
    },
    {
      title: t("calculators.bloodPressure.title"),
      description: t("calculators.bloodPressure.description"),
      category: t("categories.cardiovascular"),
      href: "/calculators/blood-pressure-calculator",
      icon: Activity,
    },
    {
      title: t("calculators.bilirubin.title"),
      description: t("calculators.bilirubin.description"),
      category: t("categories.neonatal"),
      href: "/calculators/bilirubin-calculator",
      icon: DropletsIcon,
    },
  ];

  return (
    <main className="my-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-medical-900 font-heading">
          {locale === "es" ? "Calculadoras Pediátricas" : "Pediatric Calculators"}
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {locale === "es"
            ? "Herramientas de referencia para evaluación pediátrica, seguimiento de crecimiento, dosis y decisiones clínicas que requieren verificación profesional."
            : "Reference tools for pediatric assessment, growth monitoring, dosing, and clinical decisions that require professional verification."}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block group">
              <Card className="h-full border-border/50 hover:border-medical-200 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="h-6 w-6 text-medical-700" aria-hidden="true" />
                    <Badge className="text-xs">{item.category}</Badge>
                  </div>
                  <CardTitle className="text-lg text-medical-900 group-hover:text-medical-700">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="leading-6">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-sm font-medium text-medical-700">
                  {locale === "es" ? "Abrir calculadora" : "Open calculator"}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

