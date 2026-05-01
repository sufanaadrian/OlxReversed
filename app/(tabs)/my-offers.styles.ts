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
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: theme.primaryText },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: theme.surfaceAlt,
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: theme.surface },
  tabBtnText: { fontSize: 14, fontWeight: "600", color: theme.mutedText },
  tabBtnTextActive: { color: theme.primaryText, fontWeight: "700" },

  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  separator: { height: 10 },

  // Card
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardBody: { padding: 14 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: theme.primaryText,
    lineHeight: 21,
  },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },

  applicantName: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.secondaryText,
    marginBottom: 6,
  },

  coverLetter: {
    fontSize: 13,
    color: theme.secondaryText,
    lineHeight: 18,
    marginBottom: 8,
    fontStyle: "italic",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  postedBy: { fontSize: 12, color: theme.mutedText },
  footerActions: { flexDirection: "row", gap: 8, alignItems: "center" },

  decisionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: theme.primary,
    alignItems: "center",
  },
  acceptBtnText: { fontWeight: "700", color: "#FFFFFF", fontSize: 13 },
  rejectBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
  },
  rejectBtnText: { fontWeight: "700", color: theme.secondaryText, fontSize: 13 },

  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: theme.primary,
  },
  chatBtnText: { fontWeight: "700", color: "#FFFFFF", fontSize: 13 },

  withdrawBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  withdrawBtnText: { fontSize: 12, color: theme.mutedText, fontWeight: "600" },

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
  emptySubtitle: { fontSize: 14, color: theme.secondaryText, textAlign: "center" },
});
