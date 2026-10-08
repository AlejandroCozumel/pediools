import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const sections = [
  ["purposeTitle", "referenceAid", "publicUse"],
  ["verificationTitle", "confirmInformation", "doseVerification"],
  ["limitationsTitle", "errorPossibility", "noWarranties"],
  ["emergencyTitle", "notForEmergencies"],
  ["updatesTitle", "betaWarning"],
  ["sourcesTitle", "externalSources"],
  ["liabilityTitle", "limitation", "legalRights", "acceptance"],
  ["reportTitle", "reportErrors"],
] as const;

const AppDisclaimer: React.FC = () => {
  const t = useTranslations("AppDisclaimer");
  return (
    <div className="space-y-7 text-sm leading-7 text-muted-foreground">
      <p className="text-xs">{t("updated")}</p>
      <section className="rounded-lg border border-amber-200 border-l-4 border-l-amber-400 bg-amber-50 p-4 text-amber-900">
        <h2 className="mb-2 text-base font-semibold">{t("important")}</h2>
        <p>{t("summary")}</p>
      </section>
      {sections.map(([heading, ...paragraphs]) => (
        <section
          key={heading}
          aria-labelledby={`disclaimer-${heading}`}
          className="space-y-3"
        >
          <h2
            id={`disclaimer-${heading}`}
            className="text-lg font-semibold text-medical-900"
          >
            {t(heading)}
          </h2>
          {paragraphs.map((key) => (
            <p key={key}>{t(key)}</p>
          ))}
        </section>
      ))}
      <Link
        href="/contact"
        className="inline-block font-medium text-medical-700 underline underline-offset-4"
      >
        {t("contact")}
      </Link>
    </div>
  );
};

export default AppDisclaimer;
