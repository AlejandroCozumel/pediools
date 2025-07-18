import ambulatoryBPData from "@/app/data/ambulatory-bp-reference.json";

export interface AmbulatoryBPResult {
  period: "24h" | "day" | "night";
  systolic: {
    value: number;
    percentile: number;
    normal: boolean;
    percentileCategory: string;
  };
  diastolic: {
    value: number;
    percentile: number;
    normal: boolean;
    percentileCategory: string;
  };
}

export interface DippingResult {
  systolic: {
    percentage: number;
    category:
      | "Normal dipper"
      | "Non-dipper"
      | "Reverse dipper"
      | "Extreme dipper";
    normal: boolean;
    color: string;
  };
  diastolic: {
    percentage: number;
    category:
      | "Normal dipper"
      | "Non-dipper"
      | "Reverse dipper"
      | "Extreme dipper";
    normal: boolean;
    color: string;
  };
}

export interface AmbulatoryBPAnalysis {
  results: {
    day?: AmbulatoryBPResult;
    night?: AmbulatoryBPResult;
    "24h"?: AmbulatoryBPResult;
  };
  dipping?: DippingResult;
  classification: {
    category: string;
    description: string;
    color: string;
    bgColor: string;
  };
  patientInfo: {
    age: number;
    gender: "male" | "female";
    height: number;
    heightPercentile: number;
  };
}

export interface BedsideCardData {
  patient: {
    name: string;
    age: number;
    gender: string;
    height: number;
    studyDate: string;
  };
  measurements: {
    day: { systolic: number; diastolic: number };
    night: { systolic: number; diastolic: number };
  };
  percentiles: {
    day: { systolic: number; diastolic: number };
    night: { systolic: number; diastolic: number };
  };
  dipping: DippingResult;
  referenceTable: {
    day: { [key: string]: string };
    night: { [key: string]: string };
  };
}

// Utility Functions
export class AmbulatoryBPUtils {
  /**
   * Find the closest height reference in the data
   */
  static findClosestHeight(targetHeight: number, heightData: any): number {
    const heights = Object.keys(heightData)
      .map(Number)
      .sort((a, b) => a - b);
    return heights.reduce((prev, curr) =>
      Math.abs(curr - targetHeight) < Math.abs(prev - targetHeight)
        ? curr
        : prev
    );
  }

  /**
   * Calculate percentile for a given BP value using reference data
   */
  static calculatePercentile(value: number, referenceData: any): number {
    if (!referenceData) return 50; // Default to 50th percentile if no data

    const { p5, p10, p25, p50, p75, p90, p95, p99 } = referenceData;

    if (value <= p5) return 5;
    if (value <= p10) return 5 + (5 * (value - p5)) / (p10 - p5);
    if (value <= p25) return 10 + (15 * (value - p10)) / (p25 - p10);
    if (value <= p50) return 25 + (25 * (value - p25)) / (p50 - p25);
    if (value <= p75) return 50 + (25 * (value - p50)) / (p75 - p50);
    if (value <= p90) return 75 + (15 * (value - p75)) / (p90 - p75);
    if (value <= p95) return 90 + (5 * (value - p90)) / (p95 - p90);
    if (value <= p99) return 95 + (4 * (value - p95)) / (p99 - p95);

    return Math.min(99.9, 99 + (value - p99) / 5);
  }

  /**
   * Get percentile category description
   */
  static getPercentileCategory(percentile: number): string {
    if (percentile < 10) return "<10th percentile";
    if (percentile < 25) return "10th-25th percentile";
    if (percentile < 50) return "25th-50th percentile";
    if (percentile < 75) return "50th-75th percentile";
    if (percentile < 90) return "75th-90th percentile";
    if (percentile < 95) return "90th-95th percentile";
    if (percentile < 99) return "95th-99th percentile";
    return ">99th percentile";
  }

  /**
   * Calculate nocturnal dipping
   */
  static calculateDipping(
    daytimeBP: number,
    nighttimeBP: number
  ): {
    percentage: number;
    category:
      | "Normal dipper"
      | "Non-dipper"
      | "Reverse dipper"
      | "Extreme dipper";
    normal: boolean;
    color: string;
  } {
    const dipping = ((daytimeBP - nighttimeBP) / daytimeBP) * 100;

    let category:
      | "Normal dipper"
      | "Non-dipper"
      | "Reverse dipper"
      | "Extreme dipper";
    let color: string;
    let normal: boolean;

    if (dipping >= 20) {
      category = "Extreme dipper";
      color = "text-purple-700";
      normal = false; // Extreme dipping can also be pathological
    } else if (dipping >= 10) {
      category = "Normal dipper";
      color = "text-green-700";
      normal = true;
    } else if (dipping >= 0) {
      category = "Non-dipper";
      color = "text-yellow-700";
      normal = false;
    } else {
      category = "Reverse dipper";
      color = "text-red-700";
      normal = false;
    }

    return {
      percentage: dipping,
      category,
      normal,
      color,
    };
  }

  static getReferenceData(
    age: number,
    height: number,
    gender: "male" | "female"
  ): any {
    const genderData = ambulatoryBPData[gender === "male" ? "boys" : "girls"];

    // Prefer height-based data if available
    if (height && genderData.height) {
      const closestHeight = this.findClosestHeight(height, genderData.height);
      return genderData.height[
        closestHeight.toString() as keyof typeof genderData.height
      ];
    }

    // Fallback to age-based data
    if (
      genderData.age &&
      genderData.age[age.toString() as keyof typeof genderData.age]
    ) {
      return genderData.age[age.toString() as keyof typeof genderData.age];
    }

    // Fallback to closest age
    const ages = Object.keys(genderData.age).map(Number);
    const closestAge = ages.reduce((prev, curr) =>
      Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
    );

    return genderData.age[closestAge.toString() as keyof typeof genderData.age];
  }

  static analyzePeriod(
    systolic: number,
    diastolic: number,
    period: "24h" | "day" | "night",
    referenceData: any
  ): AmbulatoryBPResult {
    const periodRef = referenceData[period];

    const systolicPercentile = this.calculatePercentile(
      systolic,
      periodRef?.systolic
    );
    const diastolicPercentile = this.calculatePercentile(
      diastolic,
      periodRef?.diastolic
    );

    return {
      period,
      systolic: {
        value: systolic,
        percentile: Math.round(systolicPercentile * 10) / 10,
        normal: systolicPercentile < 95,
        percentileCategory: this.getPercentileCategory(systolicPercentile),
      },
      diastolic: {
        value: diastolic,
        percentile: Math.round(diastolicPercentile * 10) / 10,
        normal: diastolicPercentile < 95,
        percentileCategory: this.getPercentileCategory(diastolicPercentile),
      },
    };
  }

  static classifyAmbulatoryBP(
    results: {
      day?: AmbulatoryBPResult;
      night?: AmbulatoryBPResult;
      "24h"?: AmbulatoryBPResult;
    },
    age: number,
    t: any
  ): { category: string; description: string; color: string; bgColor: string } {
    // Check if any period shows hypertension
    const hasHypertension = Object.values(results).some(
      (result) =>
        result && (!result.systolic.normal || !result.diastolic.normal)
    );

    if (!hasHypertension) {
      return {
        category: t("ambulatory.classifications.normal.category"),
        description: t("ambulatory.classifications.normal.description"),
        color: "text-green-700",
        bgColor: "bg-green-50 border-green-200",
      };
    }

    // For adolescents ≥13 years, also check adult thresholds
    if (age >= 13) {
      const hasAdultHypertension = Object.values(results).some((result) => {
        if (!result) return false;

        // Adult thresholds vary by period
        let systolicThreshold = 125; // 24h default
        let diastolicThreshold = 75;

        if (result.period === "day") {
          systolicThreshold = 130;
          diastolicThreshold = 80;
        } else if (result.period === "night") {
          systolicThreshold = 110;
          diastolicThreshold = 65;
        }

        return (
          result.systolic.value >= systolicThreshold ||
          result.diastolic.value >= diastolicThreshold
        );
      });

      if (hasAdultHypertension) {
        return {
          category: t("ambulatory.classifications.hypertension.category"),
          description: t(
            "ambulatory.classifications.hypertension.adolescentDescription"
          ),
          color: "text-red-700",
          bgColor: "bg-red-50 border-red-200",
        };
      }
    }

    // Pediatric classification based on percentiles
    const maxPercentile = Math.max(
      ...Object.values(results).flatMap((result) =>
        result ? [result.systolic.percentile, result.diastolic.percentile] : []
      )
    );

    if (maxPercentile >= 95) {
      return {
        category: t("ambulatory.classifications.hypertension.category"),
        description: t(
          "ambulatory.classifications.hypertension.pediatricDescription"
        ),
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
      };
    }

    return {
      category: t("ambulatory.classifications.normal.category"),
      description: t("ambulatory.classifications.normal.description"),
      color: "text-green-700",
      bgColor: "bg-green-50 border-green-200",
    };
  }

  static analyzeAmbulatoryBP(
    measurements: {
      systolic24h?: number;
      diastolic24h?: number;
      systolicDay?: number;
      diastolicDay?: number;
      systolicNight?: number;
      diastolicNight?: number;
    },
    patientInfo: {
      age: number;
      gender: "male" | "female";
      height: number;
      heightPercentile: number;
    },
    t: any // translations
  ): AmbulatoryBPAnalysis {
    const referenceData = this.getReferenceData(
      patientInfo.age,
      patientInfo.height,
      patientInfo.gender
    );

    const results: {
      day?: AmbulatoryBPResult;
      night?: AmbulatoryBPResult;
      "24h"?: AmbulatoryBPResult;
    } = {};

    // Analyze each period if data is available
    if (measurements.systolic24h && measurements.diastolic24h) {
      results["24h"] = this.analyzePeriod(
        measurements.systolic24h,
        measurements.diastolic24h,
        "24h",
        referenceData
      );
    }

    if (measurements.systolicDay && measurements.diastolicDay) {
      results.day = this.analyzePeriod(
        measurements.systolicDay,
        measurements.diastolicDay,
        "day",
        referenceData
      );
    }

    if (measurements.systolicNight && measurements.diastolicNight) {
      results.night = this.analyzePeriod(
        measurements.systolicNight,
        measurements.diastolicNight,
        "night",
        referenceData
      );
    }

    // Calculate dipping if both day and night data available
    let dipping: DippingResult | undefined;
    if (
      measurements.systolicDay &&
      measurements.diastolicDay &&
      measurements.systolicNight &&
      measurements.diastolicNight
    ) {
      dipping = {
        systolic: this.calculateDipping(
          measurements.systolicDay,
          measurements.systolicNight
        ),
        diastolic: this.calculateDipping(
          measurements.diastolicDay,
          measurements.diastolicNight
        ),
      };
    }

    // Classify overall result
    const classification = this.classifyAmbulatoryBP(
      results,
      patientInfo.age,
      t
    );

    return {
      results,
      dipping,
      classification,
      patientInfo,
    };
  }

  static generateBedsideCard(
    patientData: {
      name: string;
      age: number;
      gender: "male" | "female";
      height: number;
      studyDate: string;
    },
    measurements: {
      systolicDay: number;
      diastolicDay: number;
      systolicNight: number;
      diastolicNight: number;
    }
  ): BedsideCardData {
    const referenceData = this.getReferenceData(
      patientData.age,
      patientData.height,
      patientData.gender
    );

    // Calculate percentiles
    const dayPercentiles = {
      systolic: this.calculatePercentile(
        measurements.systolicDay,
        referenceData.day?.systolic
      ),
      diastolic: this.calculatePercentile(
        measurements.diastolicDay,
        referenceData.day?.diastolic
      ),
    };

    const nightPercentiles = {
      systolic: this.calculatePercentile(
        measurements.systolicNight,
        referenceData.night?.systolic
      ),
      diastolic: this.calculatePercentile(
        measurements.diastolicNight,
        referenceData.night?.diastolic
      ),
    };

    // Calculate dipping
    const dipping: DippingResult = {
      systolic: this.calculateDipping(
        measurements.systolicDay,
        measurements.systolicNight
      ),
      diastolic: this.calculateDipping(
        measurements.diastolicDay,
        measurements.diastolicNight
      ),
    };

    // Create reference table for the card
    const referenceTable = {
      day: {
        p5: `${referenceData.day?.systolic.p5 || "--"}/${
          referenceData.day?.diastolic.p5 || "--"
        }`,
        p50: `${referenceData.day?.systolic.p50 || "--"}/${
          referenceData.day?.diastolic.p50 || "--"
        }`,
        p90: `${referenceData.day?.systolic.p90 || "--"}/${
          referenceData.day?.diastolic.p90 || "--"
        }`,
        p95: `${referenceData.day?.systolic.p95 || "--"}/${
          referenceData.day?.diastolic.p95 || "--"
        }`,
        p99: `${referenceData.day?.systolic.p99 || "--"}/${
          referenceData.day?.diastolic.p99 || "--"
        }`,
      },
      night: {
        p5: `${referenceData.night?.systolic.p5 || "--"}/${
          referenceData.night?.diastolic.p5 || "--"
        }`,
        p50: `${referenceData.night?.systolic.p50 || "--"}/${
          referenceData.night?.diastolic.p50 || "--"
        }`,
        p90: `${referenceData.night?.systolic.p90 || "--"}/${
          referenceData.night?.diastolic.p90 || "--"
        }`,
        p95: `${referenceData.night?.systolic.p95 || "--"}/${
          referenceData.night?.diastolic.p95 || "--"
        }`,
        p99: `${referenceData.night?.systolic.p99 || "--"}/${
          referenceData.night?.diastolic.p99 || "--"
        }`,
      },
    };

    return {
      patient: {
        ...patientData,
        gender: patientData.gender === "male" ? "Male" : "Female",
      },
      measurements: {
        day: {
          systolic: measurements.systolicDay,
          diastolic: measurements.diastolicDay,
        },
        night: {
          systolic: measurements.systolicNight,
          diastolic: measurements.diastolicNight,
        },
      },
      percentiles: {
        day: {
          systolic: Math.round(dayPercentiles.systolic * 10) / 10,
          diastolic: Math.round(dayPercentiles.diastolic * 10) / 10,
        },
        night: {
          systolic: Math.round(nightPercentiles.systolic * 10) / 10,
          diastolic: Math.round(nightPercentiles.diastolic * 10) / 10,
        },
      },
      dipping,
      referenceTable,
    };
  }
}

export default AmbulatoryBPUtils;
