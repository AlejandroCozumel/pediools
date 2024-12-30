import growthData from "./data.json";

interface AgeRanges {
  weight: {
    min: number;
    max: number;
    normal: number;
  };
  height: {
    min: number;
    max: number;
    normal: number;
  };
  headCircumference?: {
    min: number;
    max: number;
    normal: number;
  };
  gestationalAge?: {
    min: number;
    max: number;
    normal: number;
  };
  [key: string]:
    | {
        min: number;
        max: number;
        normal: number;
      }
    | undefined;
}

// Default ranges function
function getDefaultRanges(): AgeRanges {
  return {
    weight: {
      min: 0,
      max: 100,
      normal: 50,
    },
    height: {
      min: 0,
      max: 200,
      normal: 100,
    },
  };
}

function interpolateRanges(
  data: any,
  dataKey: string,
  subKey: string | null,
  ageInMonths: number,
  gender: "male" | "female",
  measurementTypes: ("weight" | "height" | "length" | "headCirc")[]
): AgeRanges {
  // Determine the correct data path
  const growthData = subKey
    ? data[dataKey][subKey][gender]
    : data[dataKey][gender];

  const monthKeys = Object.keys(growthData)
    .map(Number)
    .sort((a, b) => a - b);

  // Find the closest data points
  let lowerKey = monthKeys[0];
  let upperKey = monthKeys[monthKeys.length - 1];

  // Adjust interpolation for sparse data
  if (ageInMonths <= lowerKey) {
    lowerKey = monthKeys[0];
    upperKey = monthKeys[1] || lowerKey;
  } else if (ageInMonths >= upperKey) {
    lowerKey = monthKeys[monthKeys.length - 2] || monthKeys[0];
    upperKey = monthKeys[monthKeys.length - 1];
  } else {
    for (let i = 0; i < monthKeys.length - 1; i++) {
      if (ageInMonths >= monthKeys[i] && ageInMonths < monthKeys[i + 1]) {
        lowerKey = monthKeys[i];
        upperKey = monthKeys[i + 1];
        break;
      }
    }
  }

  // Interpolation function with additional safeguards
  const interpolate = (
    lowerValue: number,
    upperValue: number,
    lowerAge: number,
    upperAge: number,
    currentAge: number
  ) => {
    // If ages are the same, return the lower value
    if (lowerAge === upperAge) return lowerValue;

    const t = (currentAge - lowerAge) / (upperAge - lowerAge);
    return lowerValue + (upperValue - lowerValue) * t;
  };

  // Prepare the result object
  const result: AgeRanges = {
    weight: { min: 0, max: 0, normal: 0 },
    height: { min: 0, max: 0, normal: 0 },
  };

  // Interpolate each measurement type
  measurementTypes.forEach((type) => {
    const typeMap: { [key: string]: string } = {
      weight: "weight",
      height: "height",
      length: "height",
      headCirc: "headCircumference",
    };

    const resultKey = typeMap[type] || type;
    const dataKey = type === "length" ? "length" : type;

    try {
      const lowerData = subKey
        ? growthData[lowerKey.toString()]?.[dataKey]
        : growthData[lowerKey.toString()]?.[type];

      const upperData = subKey
        ? growthData[upperKey.toString()]?.[dataKey]
        : growthData[upperKey.toString()]?.[type];

      // Ensure data exists
      if (!lowerData || !upperData) {
        console.warn(
          `No data found for ${type} at keys ${lowerKey} or ${upperKey}`
        );
        return;
      }

      // Determine the percentile keys with fallbacks
      const lowerKeys = Object.keys(lowerData);
      const percentileKeys = {
        min:
          lowerKeys.find((k) => k.includes("neg") || k.includes("p3")) || "p3",
        max:
          lowerKeys.find((k) => k.includes("pos") || k.includes("p97")) ||
          "p97",
        normal:
          lowerKeys.find((k) => k.includes("median") || k.includes("p50")) ||
          "p50",
      };

      // Ensure the keys exist in both lower and upper data
      if (
        !lowerData[percentileKeys.min] ||
        !upperData[percentileKeys.min] ||
        !lowerData[percentileKeys.max] ||
        !upperData[percentileKeys.max] ||
        !lowerData[percentileKeys.normal] ||
        !upperData[percentileKeys.normal]
      ) {
        console.warn(
          `Inconsistent data for ${type} at keys ${lowerKey} and ${upperKey}`
        );
        return;
      }

      // Only add to result if we have valid data
      result[resultKey] = {
        min: interpolate(
          lowerData[percentileKeys.min],
          upperData[percentileKeys.min],
          lowerKey,
          upperKey,
          ageInMonths
        ),
        max: interpolate(
          lowerData[percentileKeys.max],
          upperData[percentileKeys.max],
          lowerKey,
          upperKey,
          ageInMonths
        ),
        normal: interpolate(
          lowerData[percentileKeys.normal],
          upperData[percentileKeys.normal],
          lowerKey,
          upperKey,
          ageInMonths
        ),
      };
    } catch (error) {
      console.error(`Error processing ${type} data:`, error);
    }
  });

  return result;
}

// Specific implementation functions
function getWHORanges(
  ageInMonths: number,
  gender: "male" | "female"
): AgeRanges {
  return interpolateRanges(
    growthData as any,
    "who-data.json",
    null,
    ageInMonths,
    gender,
    ["weight", "height", "headCirc"]
  );
}

function getCDCChildRanges(
  ageInMonths: number,
  gender: "male" | "female"
): AgeRanges {
  return interpolateRanges(
    growthData as any,
    "cdc-data.json",
    "child",
    ageInMonths,
    gender,
    ["weight", "height"]
  );
}

function getCDCInfantRanges(
  ageInMonths: number,
  gender: "male" | "female"
): AgeRanges {
  return interpolateRanges(
    growthData as any,
    "cdc-data.json",
    "infant",
    ageInMonths,
    gender,
    ["weight", "height"]
  );
}

function getIntergrowthRanges(
  ageInMonths: number,
  gender: "male" | "female"
): AgeRanges {
  const baseRanges = interpolateRanges(
    growthData as any,
    "intergrowth-data.json",
    null,
    ageInMonths * 30,
    gender,
    ["weight", "length", "headCirc"]
  );

  return {
    ...baseRanges,
    gestationalAge: {
      min: 24,
      max: 42,
      normal: 40,
    },
  };
}

function getKromeyerRanges(
  ageInMonths: number,
  gender: "male" | "female"
): AgeRanges {
  return interpolateRanges(
    growthData as any,
    "kromeyer-data.json",
    null,
    ageInMonths,
    gender,
    ["weight", "height"]
  );
}

// Main function to get measurement ranges
export function getMeasurementRanges(
  standardId: string,
  ageInMonths: number,
  gender: "male" | "female"
): AgeRanges {
  switch (standardId) {
    case "who":
      return getWHORanges(ageInMonths, gender);
    case "cdc_infant":
      return getCDCInfantRanges(ageInMonths, gender);
    case "cdc_child":
      return getCDCChildRanges(ageInMonths, gender);
    case "intergrowth":
      return getIntergrowthRanges(ageInMonths, gender);
    case "kromeyer":
      return getKromeyerRanges(ageInMonths, gender);
    default:
      return getDefaultRanges();
  }
}
