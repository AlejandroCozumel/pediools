import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const navigation = {
  solutions: [
    { name: "Growth Charts", href: "/growth-percentiles" },
    { name: "Blood Pressure", href: "/blood-pressure" },
    { name: "BMI Calculator", href: "/bmi" },
    { name: "Heart Rate", href: "/heart-rate" },
  ],
  support: [
    { name: "Contact", href: "/contact" },
    { name: "Help Center", href: "/help" },
    { name: "Terms", href: "/terms" },
    { name: "Privacy", href: "/privacy" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Features", href: "/features" },
    { name: "Premium", href: "/premium" },
    { name: "Blog", href: "/blog" },
  ],
  social: [
    { name: "Facebook", href: "#", icon: Facebook },
    { name: "Twitter", href: "#", icon: Twitter },
    { name: "Instagram", href: "#", icon: Instagram },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer

      className="border-t border-gray-200"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-medical-600 text-xl font-bold">
              Pediatric Tools
            </h3>
            <p className="text-base font-medium text-medical-900">
              Making pediatric calculations easier and more accurate for
              healthcare professionals.
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
            <div>
              <h4 className="text-base font-semibold text-medical-900 mb-2">
                Solutions
              </h4>
              <ul className="space-y-1">
                {navigation.solutions.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-[14px] text-gray-600 hover:text-gray-900"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold text-medical-900 mb-2">
                Support
              </h4>
              <ul className="space-y-1">
                {navigation.support.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-[14px] text-gray-600 hover:text-gray-900"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold text-medical-900 mb-2">
                Company
              </h4>
              <ul className="space-y-1">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-[14px] text-gray-600 hover:text-gray-900"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-base font-semibold text-medical-900">Contact Us</h4>
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
            &copy; {year} Pediatric Tools. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
