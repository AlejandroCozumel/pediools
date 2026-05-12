import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Activity,
  DropletsIcon,
  RulerIcon,
  Pill,
  FlaskConical,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import DashboardTitle from "@/components/DashboardTitle";
import { useLocale, useTranslations } from "next-intl";

const CalculatorsList = () => {
  const t = useTranslations("CalculatorsList");
  const locale = useLocale();
  const isSpanish = locale === "es";

  const calculators = [
    {
      title: t("calculators.growthPercentiles.title"),
      description: t("calculators.growthPercentiles.description"),
      icon: <LineChart className="h-6 w-6 icon" />,
      standards: ["CDC", "WHO", "Intergrowth"],
      category: t("categories.growth"),
      link: "/calculators/growth-calculator",
    },
    {
      title: t("calculators.bmi.title"),
      description: t("calculators.bmi.description"),
      icon: <RulerIcon className="h-6 w-6 icon" />,
      category: t("categories.growth"),
      link: "/calculators/bmi-calculator",
    },
    {
      title: t("calculators.dose.title"),
      description: t("calculators.dose.description"),
      icon: <Pill className="h-6 w-6 icon" />,
      category: t("categories.dose"),
      link: "/calculators/dose-calculator",
    },
    {
      title: t("calculators.lab.title"),
      description: t("calculators.lab.description"),
      icon: <FlaskConical className="h-6 w-6 icon" />,
      category: t("categories.labs"),
      link: "/calculators/lab-calculator",
    },
    {
      title: t("calculators.bloodPressure.title"),
      description: t("calculators.bloodPressure.description"),
      icon: <Activity className="h-6 w-6 icon" />,
      category: t("categories.cardiovascular"),
      link: "/calculators/blood-pressure-calculator",
    },
    {
      title: t("calculators.bilirubin.title"),
      description: t("calculators.bilirubin.description"),
      icon: <DropletsIcon className="h-6 w-6 icon" />,
      category: t("categories.neonatal"),
      link: "/calculators/bilirubin-calculator",
    },
  ];

  const seoCopy = isSpanish
    ? {
        standardsTitle: "Herramientas basadas en referencias pediátricas",
        standardsBody:
          "PediMath reúne calculadoras pediátricas para crecimiento, IMC, presión arterial, bilirrubina neonatal, dosis y valores de laboratorio. Las herramientas usan referencias clínicas reconocidas como CDC, OMS, INTERGROWTH-21st y guías pediátricas publicadas cuando aplica.",
        safetyTitle: "Uso clínico responsable",
        safetyBody:
          "Los resultados dependen de edad, sexo, peso, talla, edad gestacional y contexto clínico correctamente ingresados. Use PediMath como apoyo educativo y verifique decisiones importantes con guías actuales, protocolos institucionales y juicio profesional.",
        browseCharts: "Ver gráficas de crecimiento",
        readDisclaimer: "Leer aviso legal",
      }
    : {
        standardsTitle: "Tools grounded in pediatric references",
        standardsBody:
          "PediMath brings together pediatric calculators for growth, BMI, blood pressure, neonatal bilirubin, medication dosing, and lab interpretation. Tools use recognized clinical references such as CDC, WHO, INTERGROWTH-21st, and published pediatric guidance where applicable.",
        safetyTitle: "Responsible clinical use",
        safetyBody:
          "Results depend on correctly entered age, sex, weight, height, gestational age, and clinical context. Use PediMath as an educational support tool and verify important decisions with current guidelines, institutional protocols, and professional judgment.",
        browseCharts: "View growth charts",
        readDisclaimer: "Read disclaimer",
      };

  return (
    <div className="my-6">
      <DashboardTitle
        title={t("dashboardTitle")}
        subtitle={t("dashboardSubtitle")}
        showBackButton={false}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {calculators.map((calc, index) => (
          <Link href={calc.link} key={index} className="block group">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-medical-200 relative overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-medical-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative p-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  {calc.icon}
                  <Badge
                    variant="default"
                    className="text-xs bg-medical-600 hover:bg-medical-700 transition-colors"
                  >
                    {calc.category}
                  </Badge>
                </div>
                <CardTitle className="text-base sm:text-lg md:text-xl mb-2 text-medical-900 group-hover:text-medical-700 transition-colors font-heading">
                  {calc.title}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground/80 leading-relaxed">
                  {calc.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative p-4 pt-0">
                {calc.standards && (
                  <div className="flex gap-1.5 flex-wrap">
                    {calc.standards.map((standard, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs border-medical-200 text-medical-700 hover:bg-medical-50 hover:text-medical-800 transition-colors"
                      >
                        {standard}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-medical-700">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              <CardTitle className="text-lg font-heading">
                {seoCopy.standardsTitle}
              </CardTitle>
            </div>
            <CardDescription className="text-sm leading-6 text-muted-foreground">
              {seoCopy.standardsBody}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href="/charts"
              className="text-sm font-medium text-medical-700 hover:text-medical-900"
            >
              {seoCopy.browseCharts}
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-medical-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <CardTitle className="text-lg font-heading">
                {seoCopy.safetyTitle}
              </CardTitle>
            </div>
            <CardDescription className="text-sm leading-6 text-muted-foreground">
              {seoCopy.safetyBody}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href="/disclaimer"
              className="text-sm font-medium text-medical-700 hover:text-medical-900"
            >
              {seoCopy.readDisclaimer}
            </Link>
          </CardContent>
        </Card>
      </section>
      {/* <div className="mt-8 sm:mt-10 lg:mt-12 flex justify-center">
        <Card className="w-full lg:w-2/3 border-medical-100 bg-gradient-to-br from-white to-medical-50">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-medical-600" />
              <CardTitle className="text-xl sm:text-2xl text-medical-900 font-heading">
                {t("premiumFeatures.title")}
              </CardTitle>
            </div>
            <CardDescription className="text-medical-700 text-base sm:text-lg mt-2">
              {t("premiumFeatures.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
              {premiumFeatures.map((feature: string, index: number) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-medical-800"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-medical-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
};

export default CalculatorsList;
