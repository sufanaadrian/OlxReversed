import { StyleSheet } from "react-native";

export const theme = {
  primary: "#1E40AF",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  primaryText: "#020617",
  secondaryText: "#64748B",
  border: "#E5E7EB",
  accentSoft: "#DBEAFE",
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },

  header: {
    height: 54,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  headerTitle: { fontSize: 16, fontWeight: "900", color: theme.primaryText },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  headerBtnText: { color: theme.secondaryText, fontWeight: "800" },

  headerBtnPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  headerBtnPrimaryText: { color: "white", fontWeight: "900" },

  content: { padding: 16, paddingBottom: 28 },

  label: {
    marginTop: 14,
    marginBottom: 8,
    color: theme.primaryText,
    fontWeight: "800",
  },

  input: {
    height: 46,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    color: theme.primaryText,
  },
  textarea: { height: 110, paddingTop: 12, textAlignVertical: "top" },

  row: { flexDirection: "row", alignItems: "center" },

  segment: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  segmentItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  segmentItemActive: { backgroundColor: theme.accentSoft },
  segmentText: { color: theme.secondaryText, fontWeight: "800" },
  segmentTextActive: { color: theme.primaryText },

  chipsRow: { gap: 8, paddingRight: 12 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipSelected: {
    backgroundColor: theme.accentSoft,
    borderColor: theme.primary,
  },
  chipText: { color: theme.secondaryText, fontWeight: "700" },
  chipTextSelected: { color: theme.primaryText, fontWeight: "900" },

  primaryBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "900" },

  helper: {
    marginTop: 10,
    color: theme.secondaryText,
    fontSize: 12,
    lineHeight: 16,
  },
});
