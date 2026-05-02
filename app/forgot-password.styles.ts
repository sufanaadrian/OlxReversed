import { StyleSheet } from "react-native";
import type { Colors } from "../src/theme/colors";

export function makeStyles(c: Colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  h1: {
    fontSize: 24,
    fontWeight: "900",
    color: c.primaryText,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: c.secondaryText,
    lineHeight: 20,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: c.primaryText,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: c.primaryText,
    backgroundColor: c.surface,
    marginBottom: 20,
  },
  sendBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: c.primary,
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
    color: c.danger,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  successMsg: {
    color: c.success,
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
    color: c.primary,
  },
  });
}
