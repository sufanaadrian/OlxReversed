import { StyleSheet } from "react-native";

export const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#0F172A",
  secondaryText: "#64748B",
  border: "#E2E8F0",
  accentSoft: "#DBEAFE",
  danger: "#DC2626",
  success: "#16a34a",
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flex: 1,
    padding: 20,
  },
  stepBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: theme.accentSoft,
    marginBottom: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.primary,
  },
  h1: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.primaryText,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.secondaryText,
    marginBottom: 20,
    lineHeight: 20,
  },

  // ─── Section ──────────────────────────────────────────────────
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.primaryText,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: theme.secondaryText,
    marginBottom: 12,
    lineHeight: 18,
  },

  // ─── Category chips ──────────────────────────────────────────
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.secondaryText,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  skipBtn: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.secondaryText,
  },

  // ─── Business details ─────────────────────────────────────────
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.primaryText,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: theme.primaryText,
    backgroundColor: theme.surface,
  },

  // ─── Terms ────────────────────────────────────────────────────
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
  },
  checkboxActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  checkboxCheck: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: theme.secondaryText,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.primary,
    fontWeight: "700",
  },

  // ─── Actions ──────────────────────────────────────────────────
  errorMsg: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  finishBtn: {
    marginTop: 20,
    height: 50,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  finishBtnDisabled: {
    opacity: 0.6,
  },
  finishBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  bottomSpace: {
    height: 40,
  },
});
