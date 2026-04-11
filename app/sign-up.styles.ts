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
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.primaryText,
    marginBottom: 6,
    marginTop: 14,
  },
  required: {
    color: theme.danger,
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
  inputError: {
    borderColor: theme.danger,
  },
  selectorRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  selectorText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.secondaryText,
  },
  selectorTextActive: {
    color: "#FFFFFF",
  },
  intentRow: {
    flexDirection: "row",
    gap: 8,
  },
  intentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  intentBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  intentText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.secondaryText,
  },
  intentTextActive: {
    color: "#FFFFFF",
  },
  errorMsg: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  successMsg: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  continueBtn: {
    marginTop: 24,
    height: 50,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginTop: 16,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 13,
    color: theme.secondaryText,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.primary,
  },
  businessSection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  businessSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.primaryText,
    marginBottom: 4,
  },
});
