import Link from "next/link";
import { useTranslations } from "next-intl";

const ShortDisclaimer: React.FC = () => {
  const t = useTranslations("AppDisclaimer");
  return (
    <div className="w-fit mx-auto !mb-4 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded text-xs">
      {t("short")} {" "}
      <Link href="/disclaimer" className="underline text-medical-600 font-semibold">
        {t("seeFullDisclaimer")}
      </Link>
    </div>
  );
};

export default ShortDisclaimer;