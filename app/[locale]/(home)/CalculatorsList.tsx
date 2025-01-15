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
  Baby,
  Heart,
  Activity,
  DropletsIcon,
  RulerIcon,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import DashboardTitle from "@/components/DashboardTitle";
import { useTranslations } from "next-intl";

const CalculatorsList = () => {
  const t = useTranslations("CalculatorsList");

  const premiumFeatures = t.raw("premiumFeatures.features") as string[];

  const calculators = [
    {
      title: t("calculators.growthPercentiles.title"),
      description: t("calculators.growthPercentiles.description"),
      icon: <LineChart className="h-6 w-6 icon" />,
      standards: ["CDC", "WHO", "Intergrowth"],
      category: t("categories.growth"),
      link: "/growth-percentiles",
    },
    {
      title: t("calculators.bloodPressure.title"),
      description: t("calculators.bloodPressure.description"),
      icon: <Activity className="h-6 w-6 icon" />,
      category: t("categories.cardiovascular"),
      link: "/blood-pressure",
    },
    {
      title: t("calculators.heartRate.title"),
      description: t("calculators.heartRate.description"),
      icon: <Heart className="h-6 w-6 icon" />,
      category: t("categories.cardiovascular"),
      link: "/heart-rate",
    },
    {
      title: t("calculators.bilirubin.title"),
      description: t("calculators.bilirubin.description"),
      icon: <DropletsIcon className="h-6 w-6 icon" />,
      category: t("categories.neonatal"),
      link: "/bilirubin-thresholds",
    },
    {
      title: t("calculators.bmi.title"),
      description: t("calculators.bmi.description"),
      icon: <RulerIcon className="h-6 w-6 icon" />,
      category: t("categories.growth"),
      link: "/bmi-calculator",
    },
    {
      title: t("calculators.headCircumference.title"),
      description: t("calculators.headCircumference.description"),
      icon: <Baby className="h-6 w-6 icon" />,
      category: t("categories.growth"),
      link: "/head-circumference",
    },
  ];

  return (
    <div className="my-6">
      <DashboardTitle
        title={t("dashboardTitle")}
        subtitle={t("dashboardSubtitle")}
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
      <div className="mt-8 sm:mt-10 lg:mt-12 flex justify-center">
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
      </div>
    </div>
  );
};

export default CalculatorsList;
