import { StyleSheet } from "react-native";
import type { Colors } from "../../src/theme/colors";

export function makeStyles(c: Colors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  closeBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: c.primaryText },

  jobTitleBox: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.primaryLight,
    borderWidth: 1,
    borderColor: c.primary,
  },
  jobTitleLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: c.primary,
    marginBottom: 4,
  },
  jobTitle: { fontSize: 15, fontWeight: "800", color: c.primaryText },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: c.primaryText,
    marginBottom: 8,
  },
  templatesRow: { marginBottom: 12, flexGrow: 0 },
  templatesContent: { gap: 8, paddingRight: 4 },
  templateChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: c.primaryLight,
    borderWidth: 1.5,
    borderColor: c.primary,
    maxWidth: 180,
  },
  templateChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: c.primary,
  },
  coverInput: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: c.primaryText,
    minHeight: 160,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 11,
    color: c.mutedText,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 16,
  },

  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: "center",
  },
  submitBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },

  screeningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#C4B5FD",
  },
  screeningLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7C3AED",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  screeningText: { fontSize: 13, color: "#4C1D95", lineHeight: 18 },

  alreadyApplied: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: c.primaryLight,
    borderWidth: 1,
    borderColor: c.primary,
  },
  alreadyAppliedText: { fontSize: 15, fontWeight: "700", color: c.primary },
  });
}
