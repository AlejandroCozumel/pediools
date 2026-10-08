import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

const ShortDisclaimer: React.FC = () => {
  const t = useTranslations("AppDisclaimer");
  return (
    <aside
      aria-label={t("title")}
      className="mx-auto mb-4 max-w-6xl rounded-lg border border-amber-200 border-l-4 border-l-amber-400 bg-amber-50 p-3 text-xs leading-6 text-amber-900"
    >
      <p>
        <strong>{t("title")}.</strong> {t("short")}
      </p>
      <Link
        href="/disclaimer"
        className="underline text-medical-600 font-semibold"
      >
        {t("seeFullDisclaimer")}
      </Link>
    </aside>
  );
};

export default ShortDisclaimer;
