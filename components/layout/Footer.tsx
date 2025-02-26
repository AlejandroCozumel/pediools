'use client';
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
  support: [
    { nameKey: "contact", href: "/contact" },
    { nameKey: "helpCenter", href: "/help" },
    { nameKey: "terms", href: "/terms" },
    { nameKey: "privacy", href: "/privacy" },
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
  const t = useTranslations('Footer');
  const year = new Date().getFullYear();

  return (
    <footer
      className="pt-6 pb-4 border-t border-gray-200"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        {t('title')}
      </h2>
      <div className="max-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-medical-600 text-xl font-bold">
              {t('mainHeading')}
            </h3>
            <p className="text-base font-medium text-medical-900">
              {t('description')}
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
          <div className="grid grid-cols-3 gap-4">
            {(['solutions', 'support', 'company'] as const).map((section) => (
              <div key={section}>
                <h4 className="text-base font-semibold text-medical-900 mb-2">
                  {t(`sections.${section}`)}
                </h4>
                <ul className="space-y-1">
                  {navigation[section].map((item) => (
                    <li key={item.nameKey}>
                      <Link
                        href={item.href}
                        className="text-[14px] text-gray-600 hover:text-gray-900"
                      >
                        {t(`links.${item.nameKey}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="text-base font-semibold text-medical-900">
              {t('contactTitle')}
            </h4>
            <Link
              href="mailto:contact@pediatrictools.com"
              className="flex items-center text-[14px] text-gray-600 hover:text-gray-900"
            >
              <Mail className="h-4 w-4 mr-2" />
              contact@pediatrictools.com
            </Link>
          </div>
        </div>
        <div className="mt-6 pt-4 text-center">
          <p className="text-[14px] text-medical-900 font-normal">
            {t('copyright', { year })}
          </p>
        </div>
      </div>
    </footer>
  );
}