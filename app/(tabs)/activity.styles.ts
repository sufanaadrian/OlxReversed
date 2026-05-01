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
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
};

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: theme.primaryText },

  // Main tab toggle (Posts / Applications)
  mainTabRow: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  mainTabBtnActive: { borderBottomColor: theme.primary },
  mainTabText: { fontSize: 13, fontWeight: "600", color: theme.mutedText },
  mainTabTextActive: { fontWeight: "800", color: theme.primary },
  mainTabBadge: {
    backgroundColor: theme.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  mainTabBadgeText: { fontSize: 10, fontWeight: "800", color: theme.primary },

  // Sub-tab (Sent / Received)
  subTabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  subTabBtn: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  subTabBtnActive: {
    backgroundColor: theme.primaryLight,
    borderColor: theme.primary,
  },
  subTabText: { fontSize: 12, fontWeight: "600", color: theme.mutedText },
  subTabTextActive: { fontWeight: "800", color: theme.primary },

  list: { padding: 12, gap: 10, paddingBottom: 40 },

  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardBoosted: { borderLeftWidth: 3, borderLeftColor: "#F59E0B" },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: theme.primaryText,
    lineHeight: 20,
  },
  cardSub: { fontSize: 12, color: theme.secondaryText, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },

  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  chip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 6,
  },
  chipText: { fontSize: 11, fontWeight: "600", color: theme.secondaryText },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, color: theme.mutedText },

  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  actionBtnDanger: { borderColor: "#FEE2E2", backgroundColor: "#FFF5F5" },
  actionBtnText: { fontSize: 12, fontWeight: "700", color: theme.primary },

  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: theme.primary,
  },
  chatBtnText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: theme.mutedText },
});
