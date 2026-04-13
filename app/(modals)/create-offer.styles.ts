import { StyleSheet } from "react-native";

export const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
};

export const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 8, gap: 10 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  backBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontWeight: "900", color: theme.primaryText },
  headerTitle: { fontSize: 18, fontWeight: "900", color: theme.primaryText },

  infoBox: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 12,
  },
  infoText: { color: theme.secondaryText, fontWeight: "700" },

  label: { fontWeight: "900", color: theme.primaryText, marginTop: 6 },
  input: {
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    color: theme.primaryText,
  },
  textArea: { height: 110, paddingTop: 12, textAlignVertical: "top" },

  cta: {
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: "white", fontWeight: "900" },
});
