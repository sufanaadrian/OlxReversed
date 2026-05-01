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
  flex: { flex: 1, backgroundColor: theme.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  hero: { alignItems: "center", marginBottom: 32, gap: 8 },
  emoji: { fontSize: 56, marginBottom: 8 },
  heroTitle: { fontSize: 28, fontWeight: "900", color: theme.primaryText, textAlign: "center" },
  heroSubtitle: { fontSize: 15, color: theme.secondaryText, textAlign: "center", lineHeight: 22 },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  roleGrid: { flexDirection: "row", gap: 10 },
  roleCard: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    gap: 6,
  },
  roleCardSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryLight,
  },
  roleIcon: { fontSize: 28 },
  roleLabel: { fontSize: 13, fontWeight: "700", color: theme.secondaryText },
  roleLabelSelected: { color: theme.primary },

  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.primaryText,
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
  },
  checkboxChecked: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  checkmark: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  termsText: { flex: 1, fontSize: 13, color: theme.secondaryText, lineHeight: 18 },

  submitBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 17, fontWeight: "900", color: "#FFFFFF" },
});
