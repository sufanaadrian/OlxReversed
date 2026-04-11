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
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  h1: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.primaryText,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: theme.secondaryText,
    lineHeight: 20,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.primaryText,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: theme.primaryText,
    backgroundColor: theme.surface,
    marginBottom: 20,
  },
  sendBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  errorMsg: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  successMsg: {
    color: theme.success,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  backLink: {
    marginTop: 16,
    alignItems: "center",
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.primary,
  },
});
