import { MessageCircleWarning } from "lucide-react";
import { useTranslations } from "next-intl";

interface ErrorMessageProps {
  message?: string;
}

const ErrorMessage = ({ message }: ErrorMessageProps) => {
  const t = useTranslations("Common");

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 px-4">
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100">
        <MessageCircleWarning className="w-8 h-8 text-red-600" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-medical-900">
          {t("error.title")}
        </h3>
        <p className="text-medical-600">{message || t("error.default")}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
