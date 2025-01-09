import React from "react";
import { Text, Image, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";

// Interfaces
interface ProgressionRow {
  date: string;
  age: string | number;
  weight: string | number;
  height: string | number;
  bmi: string | number;
  weightPercentile: number;
  heightPercentile: number;
}

interface ChartData {
  progressionData?: ProgressionRow[];
  originalInput?: {
    weight?: {
      gender?: "male" | "female";
      dateOfBirth?: string;
    };
    height?: {
      gender?: "male" | "female";
    };
  };
  success?: boolean;
  patientDetails?: PatientDetails;
}

interface ProfileDetails {
  clinicName?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phoneNumber?: string;
  logoUrl?: string;
  footerText?: string;
}

interface PatientDetails {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date | string;
  gender?: string;
  name?: string;
}

interface PDFDocumentProps {
  data?: ChartData;
  profile?: ProfileDetails;
  patient?: PatientDetails;
  chartImages?: string[];
}

// Create styles
const styles = StyleSheet.create({
  page: {
    position: "relative",
    padding: 30,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottom: "1 solid #E2E8F0",
    paddingBottom: 20,
  },
  headerLogo: {
    width: 60,
    height: 60,
    marginRight: 20,
    backgroundColor: "#E2E8F0",
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1E40AF",
    marginBottom: 5,
  },
  clinicDetails: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  patientInfo: {
    backgroundColor: "#F0F7FF",
    padding: 15,
    borderRadius: 4,
    marginBottom: 20,
  },
  patientText: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.6,
  },
  table: {
    marginTop: 10,
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F0F7FF",
    padding: 8,
    borderBottom: "1 solid #E2E8F0",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #F1F5F9",
    padding: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableCell: {
    fontSize: 10,
    color: "#334155",
  },
  tableCellHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1E40AF",
  },
  dateCell: { width: "15%" },
  ageCell: { width: "10%" },
  measurementCell: { width: "12%" },
  percentileCell: { width: "13%" },
  caption: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 10,
    textAlign: "center",
    fontStyle: "italic",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  chartImage: {
    width: "50%",
    maxHeight: 400,
    marginBottom: 10,
    objectFit: "contain",
  },
  chartSection: {
    marginTop: 10,
    breakInside: "avoid",
  },
  footer: {
    position: "absolute",
    bottom: 10,
    left: 30,
    right: 30,
    fontSize: 8,
    color: "#64748B",
    textAlign: "center",
    borderTop: "1 solid #E2E8F0",
    paddingTop: 10,
  },
});

const PDFDocument: React.FC<PDFDocumentProps> = ({
  data,
  profile,
  patient,
  chartImages,
}) => {
  const hasProgressionData =
    data?.progressionData && data.progressionData.length > 0;
  const hasChartImages = chartImages && chartImages.length > 0;

  const formatPercentile = (percentile: number) => `${percentile.toFixed(1)}%`;

  return (
    <View style={styles.page}>
      {/* Header */}
      {(profile?.clinicName || profile?.address) && (
        <View style={styles.header}>
          <View style={styles.headerLogo} />
          <View style={styles.clinicInfo}>
            <Text style={styles.clinicName}>{profile?.clinicName || ""}</Text>
            <Text style={styles.clinicDetails}>
              {profile?.address || ""}
              {"\n"}
              {profile?.city && profile?.state
                ? `${profile.city}, ${profile.state} ${
                    profile.postalCode || ""
                  }`
                : ""}
              {"\n"}
              {profile?.phoneNumber || ""}
            </Text>
          </View>
        </View>
      )}

      {/* Patient Information */}
      {(patient?.firstName || patient?.name) && (
        <View style={styles.patientInfo}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <Text style={styles.patientText}>
            Name:{" "}
            {patient?.firstName && patient?.lastName
              ? `${patient.firstName} ${patient.lastName}`
              : patient?.name || "N/A"}
            {"\n"}
            Date of Birth:{" "}
            {patient?.dateOfBirth
              ? format(new Date(patient.dateOfBirth), "PP")
              : "N/A"}
            {"\n"}
            Gender: {patient?.gender || "N/A"}
          </Text>
        </View>
      )}

      {/* Growth Data Table */}
      {hasProgressionData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Progression</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, styles.dateCell]}>
                Date
              </Text>
              <Text style={[styles.tableCellHeader, styles.ageCell]}>Age</Text>
              <Text style={[styles.tableCellHeader, styles.measurementCell]}>
                Weight
              </Text>
              <Text style={[styles.tableCellHeader, styles.percentileCell]}>
                Weight %ile
              </Text>
              <Text style={[styles.tableCellHeader, styles.measurementCell]}>
                Height
              </Text>
              <Text style={[styles.tableCellHeader, styles.percentileCell]}>
                Height %ile
              </Text>
              <Text style={[styles.tableCellHeader, styles.measurementCell]}>
                BMI
              </Text>
            </View>

            {data?.progressionData?.map((row, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.dateCell]}>
                  {row.date ? format(new Date(row.date), "MMM d, yyyy") : "N/A"}
                </Text>
                <Text style={[styles.tableCell, styles.ageCell]}>
                  {row.age || "N/A"}
                </Text>
                <Text style={[styles.tableCell, styles.measurementCell]}>
                  {row.weight || "N/A"}
                </Text>
                <Text style={[styles.tableCell, styles.percentileCell]}>
                  {formatPercentile(row.weightPercentile)}
                </Text>
                <Text style={[styles.tableCell, styles.measurementCell]}>
                  {row.height || "N/A"}
                </Text>
                <Text style={[styles.tableCell, styles.percentileCell]}>
                  {formatPercentile(row.heightPercentile)}
                </Text>
                <Text style={[styles.tableCell, styles.measurementCell]}>
                  {row.bmi || "N/A"}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.caption}>
            Historical measurements and percentiles of patient growth
          </Text>
        </View>
      )}

      {/* Chart Section */}
      {hasChartImages && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Growth Charts</Text>
          <View style={styles.chartContainer}>
            {chartImages.map((image, index) => (
              <Image key={index} src={image} style={styles.chartImage} />
            ))}
          </View>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        {profile?.footerText ||
          "© 2024 Pediatric Growth Center - Comprehensive Child Health Monitoring"}
      </Text>
    </View>
  );
};

export default PDFDocument;
