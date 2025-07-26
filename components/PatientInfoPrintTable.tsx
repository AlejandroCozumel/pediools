import React from "react";
import { User, Calendar, Ruler, Weight, Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PatientInfoPrintTableProps {
  show?: boolean;
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  dateOfMeasurement?: string;
  age?: string;
  weight?: string;
  height?: string;
  headCircumference?: string;
  gestationalAge?: string;
  systolicBP?: string;
  diastolicBP?: string;
  bloodPressure?: string;
  totalBilirubin?: string;
  etcoc?: string;
  riskFactors?: string;
  notes?: string;
}

/**
 * Renders a patient info card for printing. Modern design matching app's UI/UX.
 * Only renders fields that have data provided.
 */
export const PatientInfoPrintTable: React.FC<PatientInfoPrintTableProps> = ({
  show = false,
  name = "",
  gender = "",
  dateOfBirth = "",
  dateOfMeasurement = "",
  age = "",
  weight = "",
  height = "",
  headCircumference = "",
  gestationalAge = "",
  systolicBP = "",
  diastolicBP = "",
  bloodPressure = "",
  totalBilirubin = "",
  etcoc = "",
  riskFactors = "",
  notes = "",
}) => {
  // Helper to check if a value exists
  const hasValue = (val: string) => val && val.trim() !== "";

  // Helper for empty field styling
  const emptyField = (val: string) => val || "";

  // Define field groups with icons and data
  const fieldGroups = [
    {
      fields: [
        {
          label: "Nombre",
          value: name,
          show: true, // Always show name field
          icon: <User className="w-4 h-4" />,
        },
        {
          label: "Género",
          value: gender,
          show: hasValue(gender),
          icon: <User className="w-4 h-4" />,
        },
        {
          label: "Fecha de nacimiento",
          value: dateOfBirth,
          show: hasValue(dateOfBirth),
          icon: <Calendar className="w-4 h-4" />,
        },
        {
          label: "Fecha de medición",
          value: dateOfMeasurement,
          show: hasValue(dateOfMeasurement),
          icon: <Calendar className="w-4 h-4" />,
        },
        {
          label: "Edad",
          value: age,
          show: hasValue(age),
          icon: <Clock className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Mediciones Antropométricas",
      icon: <Ruler className="w-5 h-5" />,
      fields: [
        {
          label: "Peso (kg)",
          value: weight,
          show: hasValue(weight),
          icon: <Weight className="w-4 h-4" />,
        },
        {
          label: "Talla (cm)",
          value: height,
          show: hasValue(height),
          icon: <Ruler className="w-4 h-4" />,
        },
        {
          label: "Circunferencia cefálica (cm)",
          value: headCircumference,
          show: hasValue(headCircumference),
          icon: <Ruler className="w-4 h-4" />,
        },
        {
          label: "Edad gestacional (sem/días)",
          value: gestationalAge,
          show: hasValue(gestationalAge),
          icon: <Clock className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Signos Vitales y Laboratorios",
      icon: <Heart className="w-5 h-5" />,
      fields: [
        {
          label: "Presión arterial (mmHg)",
          value: bloodPressure || (hasValue(systolicBP) || hasValue(diastolicBP) ? `${systolicBP || "___"}/${diastolicBP || "___"}` : ""),
          show: hasValue(bloodPressure) || hasValue(systolicBP) || hasValue(diastolicBP),
          icon: <Heart className="w-4 h-4" />,
        },
        {
          label: "Bilirrubina total (mg/dL)",
          value: totalBilirubin,
          show: hasValue(totalBilirubin),
          icon: <Heart className="w-4 h-4" />,
        },
        {
          label: "ETCOc (ppm)",
          value: etcoc,
          show: hasValue(etcoc),
          icon: <Heart className="w-4 h-4" />,
        },
      ],
    },
  ];

  // Full-width fields
  const fullWidthFields = [
    {
      label: "Factores de riesgo",
      value: riskFactors,
      show: hasValue(riskFactors),
    },
    {
      label: "Notas",
      value: notes,
      show: hasValue(notes),
    },
  ];

  // Filter groups that have at least one field to show
  const visibleGroups = fieldGroups.filter(group =>
    group.fields.some(field => field.show)
  );

  const visibleFullWidthFields = fullWidthFields.filter(field => field.show);

  // Don't render if no data to show (except name which is always shown)
  if (visibleGroups.length === 0 && visibleFullWidthFields.length === 0 && !hasValue(name)) {
    return null;
  }

  return (
    <div
      className={cn(
        show ? "" : "hidden",
        "print:block print:mb-4 print:mt-2 print:w-full print:max-w-4xl print:mx-auto"
      )}
      style={{ pageBreakBefore: "always" }}
    >
      {/* Compact Table Layout */}
      <div className="border border-medical-200 rounded-lg overflow-hidden shadow-sm print:border-gray-400 print:shadow-none">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-medical-100 print:divide-gray-400">
            {/* Basic Info Row */}
            {(true || hasValue(gender) || hasValue(age)) && (
              <tr className="hover:bg-medical-25 print:hover:bg-transparent">
                <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100 w-1/6">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-medical-600 print:text-gray-600" />
                    <span>Nombre:</span>
                  </div>
                </td>
                <td className="p-3 text-gray-900 print:text-black border-r border-medical-100 print:border-gray-300 w-1/3">
                  {emptyField(name)}
                </td>
                {hasValue(gender) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100 w-1/6">
                      <span>Género:</span>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black w-1/3">
                      {gender}
                    </td>
                  </>
                )}
                {!hasValue(gender) && hasValue(age) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100 w-1/6">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-medical-600 print:text-gray-600" />
                        <span>Edad:</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black w-1/3">
                      {age}
                    </td>
                  </>
                )}
              </tr>
            )}

            {/* Dates Row */}
            {(hasValue(dateOfBirth) || hasValue(dateOfMeasurement)) && (
              <tr className="hover:bg-medical-25 print:hover:bg-transparent">
                {hasValue(dateOfBirth) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-medical-600 print:text-gray-600" />
                        <span>F. Nacimiento:</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black border-r border-medical-100 print:border-gray-300">
                      {dateOfBirth}
                    </td>
                  </>
                )}
                {hasValue(dateOfMeasurement) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-medical-600 print:text-gray-600" />
                        <span>F. Medición:</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black">
                      {dateOfMeasurement}
                    </td>
                  </>
                )}
              </tr>
            )}

            {/* Age Row (if gender was shown in first row) */}
            {hasValue(gender) && hasValue(age) && (
              <tr className="hover:bg-medical-25 print:hover:bg-transparent">
                <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-medical-600 print:text-gray-600" />
                    <span>Edad:</span>
                  </div>
                </td>
                <td className="p-3 text-gray-900 print:text-black border-r border-medical-100 print:border-gray-300">
                  {age}
                </td>
                <td className="p-3 bg-medical-50 print:bg-gray-100"></td>
                <td className="p-3"></td>
              </tr>
            )}

            {/* Measurements Row */}
            {(hasValue(weight) || hasValue(height)) && (
              <tr className="hover:bg-medical-25 print:hover:bg-transparent">
                {hasValue(weight) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Weight className="w-3.5 h-3.5 text-medical-600 print:text-gray-600" />
                        <span>Peso (kg):</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black border-r border-medical-100 print:border-gray-300">
                      {weight}
                    </td>
                  </>
                )}
                {hasValue(height) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-medical-600 print:text-gray-600" />
                        <span>Talla (cm):</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black">
                      {height}
                    </td>
                  </>
                )}
              </tr>
            )}

            {/* Additional measurements */}
            {(hasValue(headCircumference) || hasValue(gestationalAge)) && (
              <tr className="hover:bg-medical-25 print:hover:bg-transparent">
                {hasValue(headCircumference) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-medical-600 print:text-gray-600" />
                        <span>Circ. cabeza (cm):</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black border-r border-medical-100 print:border-gray-300">
                      {headCircumference}
                    </td>
                  </>
                )}
                {hasValue(gestationalAge) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                      <span>Edad gest. (sem/días):</span>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black">
                      {gestationalAge}
                    </td>
                  </>
                )}
              </tr>
            )}

            {/* Vitals Row */}
            {(hasValue(bloodPressure) || hasValue(systolicBP) || hasValue(diastolicBP) || hasValue(totalBilirubin) || hasValue(etcoc)) && (
              <tr className="hover:bg-medical-25 print:hover:bg-transparent">
                {(hasValue(bloodPressure) || hasValue(systolicBP) || hasValue(diastolicBP)) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-medical-600 print:text-gray-600" />
                        <span>PA (mmHg):</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black border-r border-medical-100 print:border-gray-300">
                      {bloodPressure || (hasValue(systolicBP) || hasValue(diastolicBP) ? `${systolicBP || "___"}/${diastolicBP || "___"}` : "")}
                    </td>
                  </>
                )}
                {hasValue(totalBilirubin) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                      <span>Bilirrubina (mg/dL):</span>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black">
                      {totalBilirubin}
                    </td>
                  </>
                )}
                {!hasValue(totalBilirubin) && hasValue(etcoc) && (
                  <>
                    <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                      <span>ETCOc (ppm):</span>
                    </td>
                    <td className="p-3 text-gray-900 print:text-black">
                      {etcoc}
                    </td>
                  </>
                )}
              </tr>
            )}

            {/* Full-width fields */}
            {visibleFullWidthFields.map((field, index) => (
              <tr key={index} className="hover:bg-medical-25 print:hover:bg-transparent">
                <td className="p-3 font-medium text-medical-700 print:text-black bg-medical-50 print:bg-gray-100">
                  <span>{field.label}:</span>
                </td>
                <td colSpan={3} className="p-3 text-gray-900 print:text-black">
                  {field.value || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compact Footer */}
      <div className="mt-2 text-xs text-gray-500 print:text-gray-600 text-right">
        {new Date().toLocaleDateString('es-ES')}
      </div>
    </div>
  );
};

export default PatientInfoPrintTable;