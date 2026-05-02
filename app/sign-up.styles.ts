import { StyleSheet } from "react-native";
import type { Colors } from "../src/theme/colors";

export function makeStyles(c: Colors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { flex: 1, padding: 24 },
  h1: {
    fontSize: 26,
    fontWeight: "900",
    color: c.primaryText,
    marginTop: 24,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: c.secondaryText,
    marginBottom: 28,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: c.primaryText,
    marginBottom: 6,
    marginTop: 16,
  },
  required: { color: c.danger },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    color: c.primaryText,
    backgroundColor: c.surface,
  },
  errorMsg: {
    color: c.danger,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 14,
    textAlign: "center",
  },
  successMsg: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 14,
    textAlign: "center",
  },
  continueBtn: {
    marginTop: 28,
    height: 52,
    borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnDisabled: { opacity: 0.6 },
  continueBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginTop: 20,
    marginBottom: 32,
  },
  footerText: { fontSize: 13, color: c.secondaryText },
  footerLink: { fontSize: 13, fontWeight: "800", color: c.primary },
  });
}
