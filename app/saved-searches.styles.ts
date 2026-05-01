import { StyleSheet } from "react-native";

export const theme = {
  primary: "#0D9488",
  primaryLight: "#CCFBF1",
  primaryDark: "#0F766E",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  primaryText: "#0F172A",
  secondaryText: "#64748B",
  mutedText: "#94A3B8",
  border: "#E2E8F0",
  error: "#EF4444",
  errorLight: "#FEE2E2",
};

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },

  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    gap: 4,
  },
  navBack: { padding: 10, borderRadius: 10 },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: theme.primaryText,
    marginLeft: 4,
  },
  navCount: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.mutedText,
    marginRight: 8,
  },

  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  separator: { height: 10 },

  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.primaryText,
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tagLabel: { fontSize: 11, color: theme.mutedText, fontWeight: "600" },
  tagValue: { fontSize: 12, color: theme.primaryText, fontWeight: "700" },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.primaryText,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.mutedText,
    textAlign: "center",
    lineHeight: 20,
  },
  browseBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: theme.primary,
    borderRadius: 14,
  },
  browseBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
