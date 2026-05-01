import { StyleSheet } from "react-native";

export const theme = {
  primary: "#0D9488",
  primaryLight: "#CCFBF1",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  primaryText: "#0F172A",
  secondaryText: "#64748B",
  mutedText: "#94A3B8",
  border: "#E2E8F0",
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  closeBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: theme.primaryText },

  jobTitleBox: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.primaryLight,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  jobTitleLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.primary,
    marginBottom: 4,
  },
  jobTitle: { fontSize: 15, fontWeight: "800", color: theme.primaryText },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.primaryText,
    marginBottom: 8,
  },
  templatesRow: { marginBottom: 12, flexGrow: 0 },
  templatesContent: { gap: 8, paddingRight: 4 },
  templateChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: theme.primaryLight,
    borderWidth: 1.5,
    borderColor: theme.primary,
    maxWidth: 180,
  },
  templateChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.primary,
  },
  coverInput: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: theme.primaryText,
    minHeight: 160,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 11,
    color: theme.mutedText,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 16,
  },

  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.primary,
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
    backgroundColor: theme.primaryLight,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  alreadyAppliedText: { fontSize: 15, fontWeight: "700", color: theme.primary },
});
