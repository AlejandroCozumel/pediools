// Data based on AAP 2004/2022 Hyperbilirubinemia Guidelines
// Phototherapy thresholds for Total Serum Bilirubin (TSB) in mg/dL

// These thresholds are for infants of 35 or more weeks' gestation.
export const phototherapyThresholds = {
  lowerRisk: {
    // For infants ≥38 weeks AND without hyperbilirubinemia risk factors
    // Key is age in hours
    "24": 12.0,
    "36": 15.0,
    "48": 18.0,
    "60": 20.0,
    "72": 21.0,
    "84": 22.0,
    "96": 22.5,
    "108": 23.0,
    "120": 23.5,
    "132": 24.0,
    "144": 24.0,
  },
  mediumRisk: {
    // For infants ≥38 weeks WITH risk factors OR 35-37 6/7 weeks without risk factors
    "24": 10.0,
    "36": 13.0,
    "48": 15.0,
    "60": 17.0,
    "72": 18.0,
    "84": 19.0,
    "96": 20.0,
    "108": 20.5,
    "120": 21.0,
    "132": 21.5,
    "144": 21.5,
  },
  higherRisk: {
    // For infants 35-37 6/7 weeks WITH risk factors
    "24": 8.0,
    "36": 11.0,
    "48": 13.0,
    "60": 14.0,
    "72": 15.0,
    "84": 16.0,
    "96": 17.0,
    "108": 17.5,
    "120": 18.0,
    "132": 18.5,
    "144": 18.5,
  },
};