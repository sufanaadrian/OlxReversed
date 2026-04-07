import { StyleSheet } from "react-native";

export const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  danger: "#DC2626",
};

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 16,
    gap: 14,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.primaryText,
  },

  desc: {
    fontSize: 15,
    color: theme.secondaryText,
    lineHeight: 22,
  },

  meta: {
    gap: 6,
  },

  metaText: {
    fontSize: 14,
    color: theme.secondaryText,
  },

  actions: {
    gap: 10,
    marginTop: 12,
  },

  primaryBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },

  dangerBtn: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  dangerText: {
    color: theme.danger,
    fontWeight: "900",
  },

  closed: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  closedText: {
    color: theme.secondaryText,
    fontWeight: "700",
  },
});
