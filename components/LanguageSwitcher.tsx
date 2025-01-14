import React from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import * as countryFlags from "country-flag-icons/react/3x2";

// Define an interface for language configuration
interface LanguageConfig {
  code: string;
  countryCode: keyof typeof countryFlags;
  name: string;
}

// Specify the languages with correct country code typing
const languages: LanguageConfig[] = [
  { code: "en", countryCode: "US", name: "ENGLISH" },
  { code: "es", countryCode: "MX", name: "ESPAÑOL" },
];

const LanguageSwitcher: React.FC = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string) => {
    console.log('Current pathname:', pathname);
    console.log('Current locale:', locale);
    console.log('New locale:', newLocale);

    // If pathname is root or empty, use root path with new locale
    const destinationPath = pathname === '/' || pathname === ''
      ? `/${newLocale}`
      : pathname;

    console.log('Destination path:', destinationPath);

    // Replace with the new locale
    router.replace(destinationPath, {
      locale: newLocale
    });
  };

  const getLanguageInfo = (langCode: string) => {
    const lang = languages.find((l) => l.code === langCode);
    if (!lang) {
      throw new Error(`Language code ${langCode} not found`);
    }
    // Safely get the flag component
    const FlagIcon = countryFlags[lang.countryCode];
    return {
      ...lang,
      FlagIcon,
    };
  };

  const currentLanguage = getLanguageInfo(locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-auto h-auto p-2">
          <currentLanguage.FlagIcon className="w-6 h-6" />
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {languages
          .filter((lang) => lang.code !== locale)
          .map((lang) => {
            const langInfo = getLanguageInfo(lang.code);
            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <langInfo.FlagIcon className="w-5 h-5 mr-2" />
                  <span>{langInfo.name}</span>
                </div>
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
