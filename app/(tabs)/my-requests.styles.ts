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
  success: "#10B981",
  successLight: "#D1FAE5",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  employer: "#7C3AED",
  employerLight: "#EDE9FE",
};

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: theme.primaryText },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  newBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },

  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  separator: { height: 10 },

  // Card
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  },
  cardBody: { padding: 14 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTopLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  categoryText: { fontSize: 12, color: theme.mutedText, fontWeight: "600" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.primaryText,
    marginBottom: 8,
    lineHeight: 22,
  },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: theme.secondaryText },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  statusText: { fontSize: 13, fontWeight: "700" },

  actions: { flexDirection: "row", gap: 6, alignItems: "center" },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
  },
  deleteBtn: { borderColor: theme.errorLight },
  filledBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 34,
    width: "auto",
    paddingHorizontal: 10,
    backgroundColor: theme.primaryLight,
    borderColor: theme.primary,
  },
  filledBtnText: { fontSize: 12, fontWeight: "700", color: theme.primary },

  bumpBtn: {
    borderColor: "#EDE9FE",
    backgroundColor: "#EDE9FE",
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: theme.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: theme.primaryText },
  emptySubtitle: {
    fontSize: 14,
    color: theme.secondaryText,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  emptyBtnText: { fontWeight: "700", color: "#FFFFFF" },
});
