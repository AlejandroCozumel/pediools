import { Baby, LineChart, Ruler, Scale } from "lucide-react";
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
    title: locale === "es" ? "Gráficas de Crecimiento Pediátrico" : "Pediatric Growth Charts",
    description:
      locale === "es"
        ? "Explora graficas de crecimiento CDC, OMS e INTERGROWTH-21st para evaluar percentiles pediatricos con contexto clinico y referencias claras."
        : "Explore CDC, WHO, and INTERGROWTH-21st growth charts for pediatric percentile assessment with clinical context and clear references.",
    url: `https://www.pedimath.com/${locale}/charts`,
    locale,
    keywords: ["pediatric growth charts", "CDC growth charts", "WHO growth standards", "INTERGROWTH"],
  });
};

export default async function ChartsIndex({
  params: { locale = "en" },
}: {
  params: { locale?: string };
}) {
  const cdc = await getTranslations({ locale, namespace: "CDCChartPage" });
  const infant = await getTranslations({ locale, namespace: "InfantCDCChartPage" });
  const intergrowth = await getTranslations({ locale, namespace: "IntergrowthChartPage" });
  const who = await getTranslations({ locale, namespace: "WHOChartPage" });

  const items = [
    {
      title: cdc("growthChartsTitle"),
      description: cdc("growthChartsSubtitle"),
      category: "CDC",
      href: "/charts/cdc-growth-chart",
      icon: LineChart,
    },
    {
      title: infant("growthChartsTitle"),
      description:
        locale === "es"
          ? "Gráficas CDC para lactantes de 0 a 36 meses"
          : "CDC infant growth charts for 0 to 36 months",
      category: "CDC",
      href: "/charts/infant-cdc-growth-chart",
      icon: Baby,
    },
    {
      title: who("whoGrowthStandardsTitle"),
      description: who("infantGrowthVisualizationSubtitle"),
      category: "WHO",
      href: "/charts/who-growth-chart",
      icon: Ruler,
    },
    {
      title: intergrowth("growthStandardsTitle"),
      description: intergrowth("pretermInfantGrowthVisualizationSubtitle"),
      category: "INTERGROWTH",
      href: "/charts/intergrowth-growth-chart",
      icon: Scale,
    },
  ];

  return (
    <main className="my-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-medical-900 font-heading">
          {locale === "es" ? "Gráficas de Crecimiento Pediátrico" : "Pediatric Growth Charts"}
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {locale === "es"
            ? "Seleccione una referencia de crecimiento para visualizar percentiles pediátricos con estándares CDC, OMS o INTERGROWTH-21st."
            : "Choose a growth reference to visualize pediatric percentiles with CDC, WHO, or INTERGROWTH-21st standards."}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
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
                  {locale === "es" ? "Abrir gráfica" : "Open chart"}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
