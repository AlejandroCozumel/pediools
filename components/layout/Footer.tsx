"use client";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

const navigation = {
  solutions: [
    { nameKey: "growthCharts", href: "/growth-percentiles" },
    { nameKey: "bloodPressure", href: "/blood-pressure" },
    { nameKey: "bmiCalculator", href: "/bmi" },
    { nameKey: "heartRate", href: "/heart-rate" },
  ],
  company: [
    { nameKey: "about", href: "/about" },
    { nameKey: "features", href: "/features" },
    { nameKey: "premium", href: "/premium" },
    { nameKey: "blog", href: "/blog" },
  ],
  social: [
    { name: "Facebook", href: "#", icon: Facebook },
    { name: "Twitter", href: "#", icon: Twitter },
    { name: "Instagram", href: "#", icon: Instagram },
  ],
};

export default function Footer() {
  const t = useTranslations("Footer");
  const s = useTranslations("CalculatorsList");
  const year = new Date().getFullYear();

  return (
    <footer
      className="pt-6 pb-4 border-t border-gray-200"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        {t("title")}
      </h2>
      <div className="max-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Branding/About/Social */}
          <div className="space-y-4">
            <h3 className="text-medical-600 text-xl font-bold">
              {t("mainHeading")}
            </h3>
            <p className="text-base font-medium text-medical-900">
              {t("description")}
            </p>
            <div className="flex space-x-4">
              {navigation.social.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-medical-900 hover:text-gray-500"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
          {/* Calculators Grid (Soluciones) - spans 2 columns on md+ */}
          <div className="md:col-span-2">
            <h4 className="text-base font-semibold text-medical-900 mb-2">
              {t("sections.solutions")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/calculators/growth-calculator" className="text-sm text-gray-500 hover:text-gray-900 font-medium block">
                {s("calculators.growthPercentiles.title")}
              </Link>
              <Link href="/calculators/blood-pressure-calculator" className="text-sm text-gray-500 hover:text-gray-900 font-medium block">
                {s("calculators.bloodPressure.title")}
              </Link>
              <Link href="/calculators/bilirubin-calculator" className="text-sm text-gray-500 hover:text-gray-900 font-medium block">
                {s("calculators.bilirubin.title")}
              </Link>
              <Link href="/calculators/bmi-calculator" className="text-sm text-gray-500 hover:text-gray-900 font-medium block">
                {s("calculators.bmi.title")}
              </Link>
              <Link href="/calculators/lab-calculator" className="text-sm text-gray-500 hover:text-gray-900 font-medium block">
                {s("calculators.lab.title")}
              </Link>
              <Link href="/calculators/dose-calculator" className="text-sm text-gray-500 hover:text-gray-900 font-medium block">
                {s("calculators.dose.title")}
              </Link>
            </div>
          </div>
          {/* Contact */}
          <div className="space-y-2 flex flex-col justify-center">
            <h4 className="text-base font-semibold text-medical-900">
              {t("contactTitle")}
            </h4>
            <Link
              href="mailto:alejandro@pedimath.com"
              className="flex items-center text-[14px] text-gray-600 hover:text-gray-900"
            >
              <Mail className="h-4 w-4 mr-2" />
              alejandro@pedimath.com
            </Link>
          </div>
        </div>
        <div className="mt-6 pt-4 text-center">
          <p className="text-[14px] text-medical-900 font-normal">
            {t("copyright", { year })}
          </p>
        </div>
      </div>
    </footer>
  );
}
